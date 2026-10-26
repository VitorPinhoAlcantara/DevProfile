import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { healthResponseSchema } from '@devprofile/shared';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('responds 200 with the health contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(healthResponseSchema.safeParse(response.body).success).toBe(true);
  });
});
