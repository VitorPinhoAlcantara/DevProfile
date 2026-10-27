import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  apiErrorSchema,
  contactMessageAcceptedSchema,
  contactMessageInputSchema,
  type ContactMessageInput,
} from '@devprofile/shared';
import { ApiRoute } from '../common/api-route.decorator.js';
import { ValidBody } from '../common/validation.js';
import { clientIp } from '../common/client-ip.js';
import { ClientIpThrottlerGuard } from '../common/throttling.js';
import { ContactService } from './contact.service.js';

@Controller('v1')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post('contact')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(ClientIpThrottlerGuard)
  @SkipThrottle({ login: true })
  @ApiRoute({
    summary: 'Enviar mensagem de contato',
    description:
      'Guarda a mensagem para ser lida no painel admin. Limitado a poucas mensagens por IP a cada 10 minutos.',
    tags: ['Contato'],
    responses: {
      202: {
        description: 'Mensagem recebida',
        schema: contactMessageAcceptedSchema,
      },
      400: { description: 'Campos inválidos', schema: apiErrorSchema },
      429: { description: 'Muitas mensagens seguidas', schema: apiErrorSchema },
    },
  })
  async send(
    @ValidBody(contactMessageInputSchema) input: ContactMessageInput,
    @Req() req: Request,
  ) {
    await this.contact.receive(input, {
      ip: clientIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    return { data: { received: true as const } };
  }
}
