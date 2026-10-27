import { Controller, Get, NotFoundException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { apiErrorSchema } from '@devprofile/shared';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidParams } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mediaDir } from './media-storage.js';

// Hash-named files only: this also rules out path traversal.
const mediaParamsSchema = z.object({
  key: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/),
});

@Controller('media')
export class MediaController {
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
    @Res() res: Response,
  ) {
    const media = await this.prisma.media.findUnique({
      where: { storageKey: key },
    });
    if (!media) throw new NotFoundException('Imagem não encontrada.');

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(key, { root: mediaDir() }, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Imagem não encontrada.' },
        });
      }
    });
  }
}
