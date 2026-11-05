import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { apiErrorSchema, mediaWidths } from '@devprofile/shared';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidParams, ValidQuery } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mediaDir, mediaVariant, variantDir } from './media-storage.js';

// Hash-named files only: this also rules out path traversal.
const mediaParamsSchema = z.object({
  key: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/),
});
const mediaQuerySchema = z.object({
  w: z
    .enum(mediaWidths)
    .optional()
    .describe('Largura de uma cópia reduzida em WebP'),
});

@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get(':key')
  @ApiRoute({
    summary: 'Imagem',
    description:
      'Imagens dos projetos e do perfil. O nome é o hash do conteúdo, então a resposta pode ficar em cache para sempre.',
    tags: ['Mídia'],
    responses: {
      200: { description: 'O arquivo da imagem' },
      404: { description: 'Imagem não encontrada', schema: apiErrorSchema },
    },
  })
  async file(
    @ValidParams(mediaParamsSchema) { key }: z.infer<typeof mediaParamsSchema>,
    @ValidQuery(mediaQuerySchema) { w }: z.infer<typeof mediaQuerySchema>,
    @Res() res: Response,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { storageKey: key },
    });
    if (!media) throw new NotFoundException('Imagem não encontrada.');

    let file = { name: key, root: mediaDir(), type: media.mimeType };
    // GIFs stay as they are, because a resize would drop the animation.
    if (w && media.mimeType !== 'image/gif') {
      try {
        const name = await mediaVariant(key, Number(w));
        file = { name, root: variantDir, type: 'image/webp' };
      } catch (error) {
        this.logger.warn(`Could not resize ${key}: ${String(error)}`);
      }
    }

    res.setHeader('Content-Type', file.type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(file.name, { root: file.root }, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Imagem não encontrada.' },
        });
      }
    });
  }
}
