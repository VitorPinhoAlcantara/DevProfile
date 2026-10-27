import {
  BadRequestException,
  Body,
  Injectable,
  Param,
  Query,
  type PipeTransform,
} from '@nestjs/common';
import type { z } from 'zod';

export type ValidationIssue = { path: string; message: string };

export class ValidationException extends BadRequestException {
  constructor(readonly issues: ValidationIssue[]) {
    super('A requisição tem campos inválidos.');
  }
}

@Injectable()
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ValidationException(
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}

/** Where the OpenAPI generator finds the schemas attached by the decorators below. */
export const REQUEST_SCHEMAS = Symbol('request-schemas');

export type RequestSchemas = {
  query?: z.ZodObject;
  params?: z.ZodObject;
  body?: z.ZodType;
};

function rememberSchema(
  target: object,
  key: string | symbol | undefined,
  part: keyof RequestSchemas,
  schema: z.ZodType,
) {
  if (key === undefined) return;
  const current: RequestSchemas =
    Reflect.getMetadata(REQUEST_SCHEMAS, target, key) ?? {};
  Reflect.defineMetadata(
    REQUEST_SCHEMAS,
    { ...current, [part]: schema },
    target,
    key,
  );
}

// Each decorator validates the request part with Zod *and* records the schema,
// so the OpenAPI document can never drift from what the route accepts.

export function ValidQuery(schema: z.ZodObject): ParameterDecorator {
  return (target, key, index) => {
    rememberSchema(target, key, 'query', schema);
    Query(new ZodValidationPipe(schema))(target, key, index);
  };
}

export function ValidParams(schema: z.ZodObject): ParameterDecorator {
  return (target, key, index) => {
    rememberSchema(target, key, 'params', schema);
    Param(new ZodValidationPipe(schema))(target, key, index);
  };
}

export function ValidBody(schema: z.ZodType): ParameterDecorator {
  return (target, key, index) => {
    rememberSchema(target, key, 'body', schema);
    Body(new ZodValidationPipe(schema))(target, key, index);
  };
}
