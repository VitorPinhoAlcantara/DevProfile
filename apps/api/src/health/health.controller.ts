import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { healthResponseSchema, type HealthResponse } from '@devprofile/shared';
import { ApiRoute } from '../common/api-route.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiRoute({
    summary: 'Saúde da API',
    description:
      'Usado pelo healthcheck do Docker. Responde 503 quando o banco está fora do ar.',
    tags: ['Infra'],
    responses: {
      200: { description: 'API e banco no ar', schema: healthResponseSchema },
      503: { description: 'Banco indisponível', schema: healthResponseSchema },
    },
  })
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthResponse> {
    const databaseUp = await this.prisma.isHealthy();
    // 503 lets Docker's healthcheck and Caddy notice a broken database connection.
    res.status(databaseUp ? 200 : 503);

    return {
      status: databaseUp ? 'ok' : 'degraded',
      service: 'api',
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database: databaseUp ? 'up' : 'down' },
    };
  }
}
