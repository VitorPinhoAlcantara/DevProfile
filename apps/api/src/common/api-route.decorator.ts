import { SetMetadata } from '@nestjs/common';
import type { z } from 'zod';

export const API_ROUTE = Symbol('api-route');

export type ApiRouteResponse = {
  description: string;
  schema?: z.ZodType;
};

export type ApiRouteOptions = {
  summary: string;
  description?: string;
  tags: string[];
  /** Keyed by HTTP status. The first 2xx entry is the success response. */
  responses: Record<number, ApiRouteResponse>;
};

/** Documents a route in the OpenAPI document. Request schemas come from `@Valid*`. */
export const ApiRoute = (options: ApiRouteOptions) =>
  SetMetadata(API_ROUTE, options);
