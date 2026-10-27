import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  InternalServerErrorException,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map } from 'rxjs';
import { API_ROUTE, type ApiRouteOptions } from './api-route.decorator.js';

/**
 * Outside production, checks every success body against the schema declared in
 * `@ApiRoute`, so a controller can't silently return something the docs don't describe.
 */
@Injectable()
export class ResponseContractInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const route = this.reflector.get<ApiRouteOptions | undefined>(
      API_ROUTE,
      context.getHandler(),
    );
    const success = Object.entries(route?.responses ?? {}).find(
      ([status]) => Number(status) < 300,
    );
    const schema = success?.[1].schema;
    if (!schema) return next.handle();

    return next.handle().pipe(
      map((body: unknown) => {
        const result = schema.safeParse(body);
        if (!result.success) {
          throw new InternalServerErrorException(
            `Resposta fora do contrato: ${result.error.message}`,
          );
        }
        return body;
      }),
    );
  }
}
