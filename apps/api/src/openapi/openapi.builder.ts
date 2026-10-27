import { z } from 'zod';

// Converts Zod schemas into an OpenAPI 3.1 document. Schemas named with
// `.meta({ id })` become reusable entries under `components.schemas`.

type JsonSchema = Record<string, unknown>;

const COMPONENT_REF = '#/components/schemas/';

function rewriteRefs(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(rewriteRefs);
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        key === '$ref' && typeof value === 'string'
          ? value.replace('#/$defs/', COMPONENT_REF)
          : rewriteRefs(value),
      ]),
    );
  }
  return node;
}

export class OpenApiSchemaCollector {
  readonly components: Record<string, JsonSchema> = {};

  /** Returns an inline schema or a `$ref`, registering named schemas as components. */
  toSchema(schema: z.ZodType, io: 'input' | 'output'): JsonSchema {
    const json = z.toJSONSchema(schema, {
      target: 'draft-2020-12',
      io,
      unrepresentable: 'any',
    }) as JsonSchema;
    const { $defs, $schema: _, id: __, ...root } = json;

    for (const [name, def] of Object.entries(
      ($defs as Record<string, JsonSchema>) ?? {},
    )) {
      this.components[name] = rewriteRefs(def) as JsonSchema;
    }

    const rootSchema = rewriteRefs(root) as JsonSchema;
    const id = z.globalRegistry.get(schema)?.id;
    if (!id) return rootSchema;

    this.components[id] = rootSchema;
    return { $ref: `${COMPONENT_REF}${id}` };
  }

  /** Expands an object schema into OpenAPI `parameters`. */
  toParameters(schema: z.ZodObject, location: 'query' | 'path'): JsonSchema[] {
    const json = z.toJSONSchema(schema, {
      target: 'draft-2020-12',
      io: 'input',
      unrepresentable: 'any',
    }) as {
      properties?: Record<string, JsonSchema>;
      required?: string[];
    };
    const required = new Set(json.required ?? []);

    return Object.entries(json.properties ?? {}).map(([name, property]) => {
      const { description, ...propertySchema } = property;
      return {
        name,
        in: location,
        required: location === 'path' || required.has(name),
        ...(description ? { description } : {}),
        schema: rewriteRefs(propertySchema),
      };
    });
  }
}
