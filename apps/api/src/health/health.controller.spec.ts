import { Test } from '@nestjs/testing';
import { healthResponseSchema } from '@devprofile/shared';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('returns a payload that matches the shared contract', () => {
    const result = controller.check();

    expect(healthResponseSchema.parse(result)).toEqual(result);
    expect(result.status).toBe('ok');
  });
});
