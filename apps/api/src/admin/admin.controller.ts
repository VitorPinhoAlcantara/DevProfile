import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import {
  adminContentSchema,
  apiErrorSchema,
  type ContactMessage,
  contactMessageSchema,
  type Dashboard,
  dashboardSchema,
  historyEntrySchema,
  markMessageInputSchema,
  type MediaItem,
  mediaItemSchema,
  saveContentInputSchema,
  savedContentSchema,
} from '@devprofile/shared';
import { AdminGuard, CurrentAdmin } from '../auth/admin.guard.js';
import { ApiException } from '../common/api.exception.js';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidBody, ValidParams } from '../common/validation.js';
import type { Media, User } from '../generated/prisma/client.js';
import {
  MediaStorage,
  mediaDir,
  mediaUrl,
  UnsupportedMediaError,
} from '../media/media-storage.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { versionTag } from '../public/localize.js';
import { ContentAdminService } from './content-admin.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const idParams = z.object({ id: z.string().uuid() });
const keyParams = z.object({
  key: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/),
});

const unauthorized = {
  description: 'Sem sessão válida',
  schema: apiErrorSchema,
};
const notFound = { description: 'Não encontrado', schema: apiErrorSchema };

const toMediaItem = (media: Media): MediaItem => ({
  id: media.id,
  key: media.storageKey,
  url: mediaUrl(media.storageKey),
  ref: `media:${media.storageKey}`,
  originalName: media.originalName,
  mimeType: media.mimeType,
  sizeBytes: media.sizeBytes,
  width: media.width,
  height: media.height,
  createdAt: media.createdAt.toISOString(),
});

const toMessage = (m: {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  readAt: Date | null;
}): ContactMessage => ({
  id: m.id,
  name: m.name,
  email: m.email,
  message: m.message,
  createdAt: m.createdAt.toISOString(),
  readAt: m.readAt?.toISOString() ?? null,
});

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  private readonly storage: MediaStorage;

  constructor(
    private readonly prisma: PrismaService,
    private readonly content: ContentAdminService,
  ) {
    this.storage = new MediaStorage(prisma);
  }

  @Get('dashboard')
  @ApiRoute({
    summary: 'Resumo do painel',
    tags: ['Admin · Painel'],
    responses: {
      200: {
        description: 'Números e últimas alterações',
        schema: dashboardSchema,
      },
      401: unauthorized,
    },
  })
  async dashboard(): Promise<Dashboard> {
    const [
      settings,
      unread,
      total,
      experiences,
      projects,
      skills,
      certifications,
      media,
      recent,
    ] = await Promise.all([
      this.prisma.siteSettings.findUnique({ where: { id: 1 } }),
      this.prisma.contactMessage.count({ where: { readAt: null } }),
      this.prisma.contactMessage.count(),
      this.prisma.experience.count(),
      this.prisma.project.count(),
      this.prisma.skill.count(),
      this.prisma.certification.count(),
      this.prisma.media.count(),
      this.content.history(5),
    ]);
    const updatedAt = settings?.contentUpdatedAt ?? new Date(0);
    return {
      version: versionTag(updatedAt),
      updatedAt: updatedAt.toISOString(),
      unreadMessages: unread,
      totalMessages: total,
      counts: { experiences, projects, skills, certifications, media },
      recentChanges: recent,
    };
  }

  @Get('content')
  @ApiRoute({
    summary: 'Ler o portfólio para edição',
    description: 'O documento completo, nos dois idiomas, mais a versão atual.',
    tags: ['Admin · Conteúdo'],
    responses: {
      200: { description: 'Conteúdo e versão', schema: adminContentSchema },
      401: unauthorized,
    },
  })
  readContent() {
    return this.content.read();
  }

  @Put('content')
  @ApiRoute({
    summary: 'Salvar o portfólio',
    description:
      'Substitui todo o conteúdo, registra o histórico e atualiza o site. Responde 409 `VERSION_CONFLICT` se o conteúdo mudou desde a leitura.',
    tags: ['Admin · Conteúdo'],
    responses: {
      200: { description: 'Nova versão', schema: savedContentSchema },
      400: { description: 'Conteúdo inválido', schema: apiErrorSchema },
      401: unauthorized,
      409: { description: 'Versão desatualizada', schema: apiErrorSchema },
    },
  })
  saveContent(
    @ValidBody(saveContentInputSchema)
    input: z.infer<typeof saveContentInputSchema>,
    @CurrentAdmin() user: User,
  ) {
    return this.content.save(input.content, input.version, user);
  }

  @Get('history')
  @ApiRoute({
    summary: 'Histórico de alterações',
    tags: ['Admin · Conteúdo'],
    responses: {
      200: {
        description: 'Últimos salvamentos',
        schema: z.array(historyEntrySchema),
      },
      401: unauthorized,
    },
  })
  history() {
    return this.content.history();
  }

  @Post('history/:id/restore')
  @ApiRoute({
    summary: 'Desfazer um salvamento',
    description: 'Restaura o conteúdo como estava antes daquele salvamento.',
    tags: ['Admin · Conteúdo'],
    responses: {
      201: { description: 'Nova versão', schema: savedContentSchema },
      401: unauthorized,
      404: notFound,
    },
  })
  restore(
    @ValidParams(idParams) { id }: z.infer<typeof idParams>,
    @CurrentAdmin() user: User,
  ) {
    return this.content.restore(id, user);
  }

  @Get('media')
  @ApiRoute({
    summary: 'Biblioteca de imagens',
    tags: ['Admin · Mídia'],
    responses: {
      200: {
        description: 'Imagens enviadas',
        schema: z.array(mediaItemSchema),
      },
      401: unauthorized,
    },
  })
  async listMedia() {
    const media = await this.prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return media.map(toMediaItem);
  }

  @Post('media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  @ApiRoute({
    summary: 'Enviar imagem',
    description:
      'Multipart com o campo `file` (JPG, PNG, WebP ou GIF, até 10 MB). Imagens repetidas não são duplicadas.',
    tags: ['Admin · Mídia'],
    responses: {
      201: { description: 'Imagem salva', schema: mediaItemSchema },
      400: {
        description: 'Arquivo ausente ou não é imagem',
        schema: apiErrorSchema,
      },
      401: unauthorized,
    },
  })
  async upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'FILE_MISSING',
        'Envie o arquivo no campo "file".',
      );
    }
    try {
      return toMediaItem(
        await this.storage.save(file.buffer, file.originalname),
      );
    } catch (error) {
      if (error instanceof UnsupportedMediaError) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'UNSUPPORTED_MEDIA',
          'Envie uma imagem JPG, PNG, WebP ou GIF.',
        );
      }
      throw error;
    }
  }

  @Delete('media/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRoute({
    summary: 'Apagar imagem',
    description:
      'Só apaga imagens que não estão em uso (capa, foto ou texto de projeto).',
    tags: ['Admin · Mídia'],
    responses: {
      204: { description: 'Imagem apagada' },
      401: unauthorized,
      404: notFound,
      409: { description: 'Imagem em uso', schema: apiErrorSchema },
    },
  })
  async deleteMedia(
    @ValidParams(keyParams) { key }: z.infer<typeof keyParams>,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { storageKey: key },
      include: { profile: true, projectCover: true },
    });
    if (!media)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Imagem não encontrada.',
      );

    const inText = await this.prisma.project.count({
      where: {
        OR: [{ bodyPt: { contains: key } }, { bodyEn: { contains: key } }],
      },
    });
    if (media.profile || media.projectCover || inText > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'MEDIA_IN_USE',
        'Essa imagem está em uso. Remova-a do conteúdo antes de apagar.',
      );
    }
    await this.prisma.media.delete({ where: { id: media.id } });
    await unlink(join(mediaDir(), key)).catch(() => undefined);
  }

  @Get('messages')
  @ApiRoute({
    summary: 'Mensagens de contato',
    tags: ['Admin · Mensagens'],
    responses: {
      200: {
        description: 'Mais recentes primeiro',
        schema: z.array(contactMessageSchema),
      },
      401: unauthorized,
    },
  })
  async messages() {
    const rows = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map(toMessage);
  }

  @Patch('messages/:id')
  @ApiRoute({
    summary: 'Marcar mensagem como lida ou não lida',
    tags: ['Admin · Mensagens'],
    responses: {
      200: { description: 'Mensagem atualizada', schema: contactMessageSchema },
      401: unauthorized,
      404: notFound,
    },
  })
  async markMessage(
    @ValidParams(idParams) { id }: z.infer<typeof idParams>,
    @ValidBody(markMessageInputSchema)
    { read }: z.infer<typeof markMessageInputSchema>,
  ) {
    const existing = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!existing)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Mensagem não encontrada.',
      );
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { readAt: read ? (existing.readAt ?? new Date()) : null },
    });
    return toMessage(updated);
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRoute({
    summary: 'Apagar mensagem',
    tags: ['Admin · Mensagens'],
    responses: { 204: { description: 'Mensagem apagada' }, 401: unauthorized },
  })
  async deleteMessage(@ValidParams(idParams) { id }: z.infer<typeof idParams>) {
    await this.prisma.contactMessage.deleteMany({ where: { id } });
  }
}
