import { BadRequestException, Injectable } from '@nestjs/common';
import { AttributeDataType, AttributeDefinition } from '@prisma/client';

/**
 * Validates a product's free-form `attributes` JSONB payload against the
 * AttributeDefinition rows configured for its category.
 *
 * Strict mode:
 *  - unknown keys are rejected
 *  - required attributes must be present
 *  - each value is type-checked against its definition's dataType
 *  - enum / multi_enum values must be drawn from the definition's options
 *
 * Returns a normalized object safe to persist as JSONB.
 */
@Injectable()
export class DynamicAttributeValidator {
  validate(
    attributes: Record<string, unknown> | undefined | null,
    definitions: AttributeDefinition[],
  ): Record<string, unknown> {
    const input = attributes ?? {};
    const byKey = new Map(definitions.map((d) => [d.key, d]));
    const errors: string[] = [];
    const normalized: Record<string, unknown> = {};

    // Reject unknown keys.
    for (const key of Object.keys(input)) {
      if (!byKey.has(key)) {
        errors.push(`Unknown attribute "${key}"`);
      }
    }

    for (const def of definitions) {
      const value = input[def.key];
      const provided = value !== undefined && value !== null;

      if (!provided) {
        if (def.isRequired) {
          errors.push(`Missing required attribute "${def.key}"`);
        }
        continue;
      }

      const error = this.checkValue(def, value);
      if (error) {
        errors.push(error);
      } else {
        normalized[def.key] = value;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Attribute validation failed',
        errors,
      });
    }

    return normalized;
  }

  private checkValue(def: AttributeDefinition, value: unknown): string | null {
    const options = Array.isArray(def.options)
      ? (def.options as string[])
      : [];

    switch (def.dataType) {
      case AttributeDataType.text:
        return typeof value === 'string'
          ? null
          : `Attribute "${def.key}" must be a string`;

      case AttributeDataType.number:
        return typeof value === 'number' && Number.isFinite(value)
          ? null
          : `Attribute "${def.key}" must be a number`;

      case AttributeDataType.boolean:
        return typeof value === 'boolean'
          ? null
          : `Attribute "${def.key}" must be a boolean`;

      case AttributeDataType.enum:
        if (typeof value !== 'string' || !options.includes(value)) {
          return `Attribute "${def.key}" must be one of: ${options.join(', ')}`;
        }
        return null;

      case AttributeDataType.multi_enum:
        if (
          !Array.isArray(value) ||
          value.some((v) => typeof v !== 'string' || !options.includes(v))
        ) {
          return `Attribute "${def.key}" must be an array of: ${options.join(', ')}`;
        }
        return null;

      default:
        return `Attribute "${def.key}" has an unsupported data type`;
    }
  }
}
