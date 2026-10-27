import { z } from 'zod';

export const healthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    service: z.string(),
    uptimeSeconds: z.number().nonnegative(),
    checks: z.object({
      database: z.enum(['up', 'down']),
    }),
  })
  .meta({ id: 'Health' });

export type HealthResponse = z.infer<typeof healthResponseSchema>;
