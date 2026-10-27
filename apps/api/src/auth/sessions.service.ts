import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashToken, newSessionToken } from './crypto.js';

export const SESSION_COOKIE = 'dp_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// lastSeenAt is informative only, so it is refreshed at most every few minutes.
const TOUCH_EVERY_MS = 5 * 60 * 1000;

export type SessionOrigin = { ip: string | null; userAgent: string | null };

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates a session and returns the raw token for the cookie. */
  async create(userId: string, origin: SessionOrigin) {
    const token = newSessionToken();
    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        ip: origin.ip,
        userAgent: origin.userAgent?.slice(0, 500) ?? null,
      },
    });
    return token;
  }

  async findUser(token: string): Promise<User | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }
    if (Date.now() - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
    }
    return session.user;
  }

  async revoke(token: string) {
    await this.prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  /** Ends every other session, e.g. after a password change. */
  async revokeOthers(userId: string, keepToken: string) {
    await this.prisma.session.deleteMany({
      where: { userId, NOT: { tokenHash: hashToken(keepToken) } },
    });
  }
}
