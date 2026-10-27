import { Injectable, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import {
  API_ROUTE,
  type ApiRouteOptions,
} from '../common/api-route.decorator.js';
import { REQUEST_SCHEMAS, type RequestSchemas } from '../common/validation.js';
import { API_PREFIX } from '../app.setup.js';
import { OpenApiSchemaCollector } from './openapi.builder.js';

type Operation = Record<string, unknown>;

const readMetadata = <T>(key: unknown, target: object): T | undefined =>
  Reflect.getMetadata(key, target) as T | undefined;

function joinPath(...parts: (string | string[] | undefined)[]) {
  const segments = parts
    .flatMap((part) => (Array.isArray(part) ? part[0] : part))
    .filter((part): part is string => !!part && part !== '/')
    .map((part) => part.replace(/^\/|\/$/g, ''));
  // Express `:slug` becomes OpenAPI `{slug}`.
  return `/${segments.join('/')}`.replace(/:(\w+)/g, '{$1}');
}

/** Builds the OpenAPI document from every route decorated with `@ApiRoute`. */
@Injectable()
export class OpenApiService {
  private document: Record<string, unknown> | undefined;

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  getDocument() {
    this.document ??= this.build();
    return this.document;
  }

  private build() {
    const collector = new OpenApiSchemaCollector();
    const paths: Record<string, Record<string, Operation>> = {};

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;
      const controllerPath = readMetadata<string | string[]>(
        PATH_METADATA,
        metatype,
      );
      const prototype = Object.getPrototypeOf(instance) as object;

      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = (prototype as Record<string, object>)[methodName]!;
        const route = readMetadata<ApiRouteOptions>(API_ROUTE, handler);
        const requestMethod = readMetadata<RequestMethod>(
          METHOD_METADATA,
          handler,
        );
        if (!route || requestMethod === undefined) continue;

        const method = RequestMethod[requestMethod].toLowerCase();
        const path = joinPath(
          API_PREFIX,
          controllerPath,
          readMetadata<string | string[]>(PATH_METADATA, handler),
        );
        const schemas: RequestSchemas =
          Reflect.getMetadata(REQUEST_SCHEMAS, prototype, methodName) ?? {};

        const parameters = [
          ...(schemas.params
            ? collector.toParameters(schemas.params, 'path')
            : []),
          ...(schemas.query
            ? collector.toParameters(schemas.query, 'query')
            : []),
        ];

        paths[path] ??= {};
        paths[path][method] = {
          operationId: `${metatype.name.replace(/Controller$/, '')}_${methodName}`,
          summary: route.summary,
          ...(route.description ? { description: route.description } : {}),
          tags: route.tags,
          ...(parameters.length ? { parameters } : {}),
          ...(schemas.body
            ? {
                requestBody: {
                  required: true,
                  content: {
                    'application/json': {
                      schema: collector.toSchema(schemas.body, 'input'),
                    },
                  },
                },
              }
            : {}),
          responses: Object.fromEntries(
            Object.entries(route.responses).map(([status, response]) => [
              status,
              {
                description: response.description,
                ...(response.schema
                  ? {
                      content: {
                        'application/json': {
                          schema: collector.toSchema(response.schema, 'output'),
                        },
                      },
                    }
                  : {}),
              },
            ]),
          ),
        };
      }
    }

    return {
      openapi: '3.1.0',
      info: {
        title: 'Vitor Pinho Alcantara — Portfolio API',
        version: '1.0.0',
        description:
          'API pública do portfólio. Todos os endpoints de conteúdo aceitam `?lang=pt-BR` (padrão) ou `?lang=en`.',
      },
      servers: [{ url: '/' }],
      // Same order as the site's sections.
      tags: [
        'Portfólio',
        'Sobre',
        'Carreira',
        'Projetos',
        'Formação',
        'Contato',
        'Mídia',
        'Infra',
        'Admin · Conta',
        'Admin · Painel',
        'Admin · Conteúdo',
        'Admin · Mídia',
        'Admin · Mensagens',
      ].map((name) => ({ name })),
      paths: Object.fromEntries(
        Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)),
      ),
      components: { schemas: collector.components },
    };
  }
}
