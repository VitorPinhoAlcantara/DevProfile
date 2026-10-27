import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiError } from '@devprofile/shared';
import { ApiException } from './api.exception.js';
import { ValidationException } from './validation.js';

const codeByStatus: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/** Turns every error into the `ApiError` envelope documented in OpenAPI. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ValidationException) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: exception.message,
          details: exception.issues,
        },
      } satisfies ApiError);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res.status(status).json({
        error: {
          code:
            exception instanceof ApiException
              ? exception.code
              : (codeByStatus[status] ?? `HTTP_${status}`),
          message: exception.message,
        },
      } satisfies ApiError);
      return;
    }

    this.logger.error(exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro inesperado no servidor.',
      },
    } satisfies ApiError);
  }
}
