import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ADMIN_HEADER } from '@devprofile/shared';
import { ApiException } from '../common/api.exception.js';
import type { User } from '../generated/prisma/client.js';
import { SESSION_COOKIE, SessionsService } from './sessions.service.js';

type AdminRequest = Request & { admin?: User; sessionToken?: string };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Requires a valid session cookie. Writes also need the `X-DevProfile-Admin`
 * header: a cross-site form can't set custom headers and CORS is closed, so this
 * plus the SameSite cookie blocks CSRF.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AdminRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE
    ];
    const user = token ? await this.sessions.findUser(token) : null;
    if (!user || !token) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'Faça login para continuar.',
      );
    }
    if (!SAFE_METHODS.has(req.method) && req.headers[ADMIN_HEADER] !== '1') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'CSRF_HEADER_MISSING',
        `Requisições de escrita precisam do cabeçalho ${ADMIN_HEADER}.`,
      );
    }
    req.admin = user;
    req.sessionToken = token;
    return true;
  }
}

/** The logged-in admin, set by AdminGuard. */
export const CurrentAdmin = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AdminRequest>().admin!,
);

/** The raw session token of the current request, set by AdminGuard. */
export const SessionToken = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AdminRequest>().sessionToken!,
);
