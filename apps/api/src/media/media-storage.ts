import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { imageSize } from 'image-size';
import type { Media, PrismaClient } from '../generated/prisma/client.js';

/** Public path images are served from (see MediaController). */
export const mediaUrl = (storageKey: string) => `/api/media/${storageKey}`;

/** Where files live: a Docker volume in production, `apps/api/uploads` locally. */
export const mediaDir = () => resolve(process.env.MEDIA_DIR ?? 'uploads');

const MIME_BY_TYPE: Record<string, { ext: string; mime: string }> = {
  jpg: { ext: 'jpg', mime: 'image/jpeg' },
  png: { ext: 'png', mime: 'image/png' },
  webp: { ext: 'webp', mime: 'image/webp' },
  gif: { ext: 'gif', mime: 'image/gif' },
};

export class UnsupportedMediaError extends Error {}

/**
 * Stores images under a content hash, so the same file is kept once and its URL
 * never changes (it can be cached forever).
 */
export class MediaStorage {
  constructor(
    private readonly db: Pick<PrismaClient, 'media'>,
    private readonly dir = mediaDir(),
  ) {}

  async save(data: Uint8Array, originalName: string): Promise<Media> {
    let size: ReturnType<typeof imageSize>;
    try {
      size = imageSize(data);
    } catch {
      throw new UnsupportedMediaError(`Not an image: ${originalName}`);
    }
    const format = MIME_BY_TYPE[size.type ?? ''];
    if (!format) {
      throw new UnsupportedMediaError(`Unsupported image type: ${size.type}`);
    }

    const hash = createHash('sha256').update(data).digest('hex').slice(0, 32);
    const storageKey = `${hash}.${format.ext}`;
    const existing = await this.db.media.findUnique({ where: { storageKey } });
    if (existing) return existing;

    await mkdir(this.dir, { recursive: true });
    try {
      await writeFile(join(this.dir, storageKey), data, { flag: 'wx' });
    } catch (error) {
      // Same content already on disk (e.g. the row was deleted): reuse the file.
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }

    return this.db.media.create({
      data: {
        storageKey,
        originalName,
        mimeType: format.mime,
        sizeBytes: data.byteLength,
        width: size.width,
        height: size.height,
      },
    });
  }
}
