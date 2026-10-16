// Request validation with the zod schemas from @kisa/shared, plus Swagger docs generated from them.
import { ApiBody } from "@nestjs/swagger";
import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { z } from "zod";

/** Validates (and transforms) a body, query or param; responds 400 with readable issues. */
@Injectable()
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    return result.data;
  }
}

// The OpenAPI schema type that ApiBody accepts (not exported by @nestjs/swagger).
type BodySchema = NonNullable<Extract<Parameters<typeof ApiBody>[0], { schema?: unknown }>["schema"]>;

/** Swagger request body generated from a zod schema, so docs never drift from validation. */
export const ZodApiBody = (schema: z.ZodType) =>
  ApiBody({ schema: z.toJSONSchema(schema, { io: "input", target: "openapi-3.0" }) as BodySchema });
