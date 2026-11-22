import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import {
  apiErrorSchema,
  type ShortLinkInput,
  shortLinkInputSchema,
  shortLinkSchema,
} from '@devprofile/shared';
import { AdminGuard } from '../auth/admin.guard.js';
import { ApiException } from '../common/api.exception.js';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidBody, ValidParams } from '../common/validation.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toShortLinkDto } from './links.service.js';

const idParams = z.object({ id: z.string().uuid() });
const unauthorized = {
  description: 'Sem sessão válida',
  schema: apiErrorSchema,
};

const slugTaken = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
    return new ApiException(
      HttpStatus.CONFLICT,
      'SLUG_TAKEN',
      'Já existe um link com esse endereço.',
    );
  return error;
};

@Controller('admin/links')
@UseGuards(AdminGuard)
export class LinksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiRoute({
    summary: 'Listar links curtos',
    tags: ['Admin · Links'],
    responses: {
      200: {
        description: 'Links, do mais novo ao mais antigo',
        schema: shortLinkSchema.array(),
      },
      401: unauthorized,
    },
  })
  async list() {
    const links = await this.prisma.shortLink.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return links.map(toShortLinkDto);
  }

  @Post()
  @ApiRoute({
    summary: 'Criar link curto',
    tags: ['Admin · Links'],
    responses: {
      201: { description: 'Link criado', schema: shortLinkSchema },
      401: unauthorized,
      409: { description: 'Endereço já usado', schema: apiErrorSchema },
    },
  })
  async create(@ValidBody(shortLinkInputSchema) input: ShortLinkInput) {
    try {
      return toShortLinkDto(
        await this.prisma.shortLink.create({ data: input }),
      );
    } catch (error) {
      throw slugTaken(error);
    }
  }

  @Put(':id')
  @ApiRoute({
    summary: 'Editar link curto',
    tags: ['Admin · Links'],
    responses: {
      200: { description: 'Link atualizado', schema: shortLinkSchema },
      401: unauthorized,
      404: { description: 'Não encontrado', schema: apiErrorSchema },
      409: { description: 'Endereço já usado', schema: apiErrorSchema },
    },
  })
  async update(
    @ValidParams(idParams) { id }: z.infer<typeof idParams>,
    @ValidBody(shortLinkInputSchema) input: ShortLinkInput,
  ) {
    const existing = await this.prisma.shortLink.findUnique({ where: { id } });
    if (!existing)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        'Link não encontrado.',
      );
    try {
      return toShortLinkDto(
        await this.prisma.shortLink.update({ where: { id }, data: input }),
      );
    } catch (error) {
      throw slugTaken(error);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRoute({
    summary: 'Apagar link curto',
    tags: ['Admin · Links'],
    responses: { 204: { description: 'Link apagado' }, 401: unauthorized },
  })
  async remove(@ValidParams(idParams) { id }: z.infer<typeof idParams>) {
    await this.prisma.shortLink.deleteMany({ where: { id } });
  }
}
