import { z } from 'zod';

export const healthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    service: z.string(),
    checks: z.object({
      database: z.enum(['up', 'down']),
    }),
  })
  .meta({ id: 'Health' });

export type HealthResponse = z.infer<typeof healthResponseSchema>;
