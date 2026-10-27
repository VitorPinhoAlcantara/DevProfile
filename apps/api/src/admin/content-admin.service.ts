import { HttpStatus, Injectable } from '@nestjs/common';
import {
  type AdminContent,
  type HistoryEntry,
  type PortfolioContent,
  portfolioSchema,
  portfolioSections,
} from '@devprofile/shared';
import { ApiException } from '../common/api.exception.js';
import { exportPortfolio } from '../content/export-portfolio.js';
import {
  importPortfolio,
  type MediaResolver,
} from '../content/import-portfolio.js';
import type { Prisma, User } from '../generated/prisma/client.js';
import { mediaUrl } from '../media/media-storage.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RevalidationService } from './revalidation.service.js';

const AUDIT_ENTITY = 'portfolio';

/** Sections whose JSON differs between two snapshots. */
export function changedSections(
  before: PortfolioContent | null,
  after: PortfolioContent | null,
): HistoryEntry['changed'] {
  return portfolioSections.filter(
    (section) =>
      JSON.stringify(before?.[section]) !== JSON.stringify(after?.[section]),
  );
}

/**
 * The admin edits the portfolio as one document. Each save replaces the content,
 * keeps before/after snapshots in the audit log (for history and undo) and
 * refreshes the public site.
 */
@Injectable()
export class ContentAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidation: RevalidationService,
  ) {}

  async read(): Promise<AdminContent> {
    const [content, version] = await Promise.all([
      exportPortfolio(this.prisma),
      this.currentVersion(),
    ]);
    return { content, version };
  }

  async save(
    content: PortfolioContent,
    expectedVersion: string | null,
    actor: User,
    action: 'UPDATE' | 'RESTORE' = 'UPDATE',
  ) {
    if (
      expectedVersion !== null &&
      expectedVersion !== (await this.currentVersion())
    ) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'VERSION_CONFLICT',
        'O conteúdo foi alterado em outra aba ou sessão. Recarregue para ver a versão atual.',
      );
    }
    this.checkUniqueCovers(content);

    const before = await exportPortfolio(this.prisma);
    await importPortfolio(this.prisma, content, this.resolveExistingMedia);
    const after = await exportPortfolio(this.prisma);

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        entity: AUDIT_ENTITY,
        entityId: '1',
        before: before as unknown as Prisma.InputJsonValue,
        after: after as unknown as Prisma.InputJsonValue,
      },
    });
    await this.revalidation.refreshSite();
    return { version: await this.currentVersion() };
  }

  async history(limit = 50): Promise<HistoryEntry[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: { entity: AUDIT_ENTITY },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { email: true } } },
    });
    return entries.map((entry) => ({
      id: entry.id,
      action: entry.action === 'RESTORE' ? 'RESTORE' : 'UPDATE',
      createdAt: entry.createdAt.toISOString(),
      actor: entry.actor?.email ?? null,
      changed: changedSections(
        entry.before as PortfolioContent | null,
        entry.after as PortfolioContent | null,
      ),
    }));
  }

  /** Undoes one save by restoring the content as it was right before it. */
  async restore(entryId: string, actor: User) {
    const entry = await this.prisma.auditLog.findFirst({
      where: { id: entryId, entity: AUDIT_ENTITY },
    });
    if (!entry?.before) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Registro do histórico não encontrado.',
      );
    }
    const snapshot = portfolioSchema.safeParse(entry.before);
    if (!snapshot.success) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'SNAPSHOT_OUTDATED',
        'Esse registro é de uma versão antiga do formato e não pode ser restaurado.',
      );
    }
    return this.save(snapshot.data, null, actor, 'RESTORE');
  }

  private async currentVersion() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
    });
    return (settings?.contentUpdatedAt ?? new Date(0)).toISOString();
  }

  /** In the admin, images are referenced as `media:<storageKey>` of an upload. */
  private resolveExistingMedia: MediaResolver = async (key) => {
    const media = await this.prisma.media.findUnique({
      where: { storageKey: key },
    });
    if (!media) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'UNKNOWN_MEDIA',
        `Imagem não encontrada: ${key}. Envie a imagem pela biblioteca de mídia.`,
      );
    }
    return { id: media.id, url: mediaUrl(media.storageKey) };
  };

  private checkUniqueCovers(content: PortfolioContent) {
    const covers = content.projects.flatMap((p) => (p.cover ? [p.cover] : []));
    if (new Set(covers).size !== covers.length) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'DUPLICATE_COVER',
        'Cada projeto precisa de uma imagem de capa própria.',
      );
    }
  }
}
