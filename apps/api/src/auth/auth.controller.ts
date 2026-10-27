import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import QRCode from 'qrcode';
import {
  type AdminMe,
  adminMeSchema,
  apiErrorSchema,
  type ChangePasswordInput,
  changePasswordInputSchema,
  type LoginInput,
  loginInputSchema,
  totpDisableInputSchema,
  totpEnableInputSchema,
  totpSetupSchema,
} from '@devprofile/shared';
import type { z } from 'zod';
import { ApiException } from '../common/api.exception.js';
import { ApiRoute } from '../common/api-route.decorator.js';
import { clientIp } from '../common/client-ip.js';
import { ClientIpThrottlerGuard } from '../common/throttling.js';
import { ValidBody } from '../common/validation.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminGuard, CurrentAdmin, SessionToken } from './admin.guard.js';
import {
  decrypt,
  encrypt,
  hashPassword,
  newTotpSecret,
  totpUri,
  verifyAgainstDummy,
  verifyPassword,
  verifyTotp,
} from './crypto.js';
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  SessionsService,
} from './sessions.service.js';

const toMe = (user: User): AdminMe => ({
  email: user.email,
  totpEnabled: user.totpEnabledAt !== null,
});

// Off only for plain-HTTP test setups; production sits behind Cloudflare's HTTPS.
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure:
    process.env.NODE_ENV === 'production' &&
    process.env.COOKIE_SECURE !== 'false',
  path: '/api',
});

const invalidCredentials = () =>
  new ApiException(
    HttpStatus.UNAUTHORIZED,
    'INVALID_CREDENTIALS',
    'E-mail, senha ou código incorretos.',
  );

const unauthorized = {
  description: 'Sem sessão válida',
  schema: apiErrorSchema,
};

@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClientIpThrottlerGuard)
  @SkipThrottle({ contact: true })
  @ApiRoute({
    summary: 'Entrar no painel',
    description:
      'Abre uma sessão (cookie httpOnly). Com 2FA ativo, sem `totp` a resposta é 401 `TOTP_REQUIRED`.',
    tags: ['Admin · Conta'],
    responses: {
      200: { description: 'Sessão aberta', schema: adminMeSchema },
      401: {
        description: '`INVALID_CREDENTIALS` ou `TOTP_REQUIRED`',
        schema: apiErrorSchema,
      },
      429: { description: 'Muitas tentativas', schema: apiErrorSchema },
    },
  })
  async login(
    @ValidBody(loginInputSchema) input: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminMe> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    const passwordOk = user
      ? await verifyPassword(user.passwordHash, input.password)
      : await verifyAgainstDummy(input.password);
    if (!user || !passwordOk) throw invalidCredentials();

    if (user.totpEnabledAt && user.totpSecret) {
      if (!input.totp) {
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          'TOTP_REQUIRED',
          'Informe o código do app autenticador.',
        );
      }
      if (!verifyTotp(decrypt(user.totpSecret), input.totp)) {
        throw invalidCredentials();
      }
    }

    const token = await this.sessions.create(user.id, {
      ip: clientIp(req),
      userAgent: req.headers['user-agent'] ?? null,
    });
    res.cookie(SESSION_COOKIE, token, {
      ...cookieOptions(),
      maxAge: SESSION_TTL_MS,
    });
    return toMe(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Sair',
    tags: ['Admin · Conta'],
    responses: { 204: { description: 'Sessão encerrada' }, 401: unauthorized },
  })
  async logout(
    @SessionToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.sessions.revoke(token);
    res.clearCookie(SESSION_COOKIE, cookieOptions());
  }

  @Get('me')
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Quem está logado',
    tags: ['Admin · Conta'],
    responses: {
      200: { description: 'Admin da sessão', schema: adminMeSchema },
      401: unauthorized,
    },
  })
  me(@CurrentAdmin() user: User): AdminMe {
    return toMe(user);
  }

  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Trocar a senha',
    description: 'Encerra as outras sessões abertas.',
    tags: ['Admin · Conta'],
    responses: {
      204: { description: 'Senha trocada' },
      401: unauthorized,
    },
  })
  async changePassword(
    @ValidBody(changePasswordInputSchema) input: ChangePasswordInput,
    @CurrentAdmin() user: User,
    @SessionToken() token: string,
  ) {
    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      throw invalidCredentials();
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });
    await this.sessions.revokeOthers(user.id, token);
  }

  @Post('totp/setup')
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Começar a configurar o 2FA',
    description:
      'Gera um segredo novo (ainda inativo) e o QR code para o app autenticador.',
    tags: ['Admin · Conta'],
    responses: {
      201: { description: 'Segredo e QR code', schema: totpSetupSchema },
      401: unauthorized,
    },
  })
  async setupTotp(@CurrentAdmin() user: User) {
    if (user.totpEnabledAt) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'TOTP_ALREADY_ENABLED',
        'O 2FA já está ativo.',
      );
    }
    const secret = newTotpSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: encrypt(secret) },
    });
    const otpauthUrl = totpUri(secret, user.email);
    return {
      secret,
      otpauthUrl,
      qrSvg: await QRCode.toString(otpauthUrl, { type: 'svg', margin: 1 }),
    };
  }

  @Post('totp/enable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Ativar o 2FA',
    description: 'Confirma o segredo gerado no setup com um código do app.',
    tags: ['Admin · Conta'],
    responses: { 204: { description: '2FA ativo' }, 401: unauthorized },
  })
  async enableTotp(
    @ValidBody(totpEnableInputSchema)
    { code }: z.infer<typeof totpEnableInputSchema>,
    @CurrentAdmin() user: User,
  ) {
    if (!user.totpSecret || !verifyTotp(decrypt(user.totpSecret), code)) {
      throw invalidCredentials();
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpEnabledAt: new Date() },
    });
  }

  @Post('totp/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AdminGuard)
  @ApiRoute({
    summary: 'Desativar o 2FA',
    description: 'Pede a senha e um código atual.',
    tags: ['Admin · Conta'],
    responses: { 204: { description: '2FA desativado' }, 401: unauthorized },
  })
  async disableTotp(
    @ValidBody(totpDisableInputSchema)
    { code, password }: z.infer<typeof totpDisableInputSchema>,
    @CurrentAdmin() user: User,
  ) {
    const ok =
      user.totpSecret &&
      (await verifyPassword(user.passwordHash, password)) &&
      verifyTotp(decrypt(user.totpSecret), code);
    if (!ok) throw invalidCredentials();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: null, totpEnabledAt: null },
    });
  }
}
