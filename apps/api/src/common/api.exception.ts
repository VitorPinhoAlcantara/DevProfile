import { HttpException, type HttpStatus } from '@nestjs/common';

/** An HTTP error with a machine-readable `code` the client can branch on. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
  ) {
    super(message, status);
  }
}
