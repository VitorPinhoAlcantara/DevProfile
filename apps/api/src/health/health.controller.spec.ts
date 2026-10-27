import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { healthResponseSchema } from '@devprofile/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const isHealthy = vi.fn<() => Promise<boolean>>();
  const status = vi.fn();
  const res = { status } as unknown as Response;
  let controller: HealthController;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { isHealthy } }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports ok with 200 when the database answers', async () => {
    isHealthy.mockResolvedValue(true);

    const result = await controller.check(res);

    expect(healthResponseSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({
      status: 'ok',
      checks: { database: 'up' },
    });
    expect(status).toHaveBeenCalledWith(200);
  });

  it('reports degraded with 503 when the database is down', async () => {
    isHealthy.mockResolvedValue(false);

    const result = await controller.check(res);

    expect(result).toMatchObject({
      status: 'degraded',
      checks: { database: 'down' },
    });
    expect(status).toHaveBeenCalledWith(503);
  });
});
