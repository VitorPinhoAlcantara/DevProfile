import { Injectable, Logger } from '@nestjs/common';
import type { ContactMessageInput } from '@devprofile/shared';
import { PrismaService } from '../prisma/prisma.service.js';

type RequestOrigin = { ip: string | null; userAgent: string | null };

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async receive(input: ContactMessageInput, origin: RequestOrigin) {
    // Bots fill the hidden `website` field; accept the request but drop the message.
    if (input.website) {
      this.logger.warn(`Contact honeypot triggered from ${origin.ip ?? '?'}`);
      return;
    }

    await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        message: input.message,
        ip: origin.ip,
        userAgent: origin.userAgent?.slice(0, 500) ?? null,
      },
    });
  }
}
