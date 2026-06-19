import { BadRequestException } from '@nestjs/common';
import { AttributeDataType, AttributeDefinition } from '@prisma/client';
import { DynamicAttributeValidator } from './dynamic-attribute.validator';

/** Build an AttributeDefinition with sane defaults; override per test. */
function def(partial: Partial<AttributeDefinition>): AttributeDefinition {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    categoryId: '00000000-0000-0000-0000-000000000001',
    key: 'attr',
    label: 'Attr',
    dataType: AttributeDataType.text,
    unit: null,
    options: null,
    isRequired: false,
    isFilterable: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('DynamicAttributeValidator', () => {
  const validator = new DynamicAttributeValidator();

  it('returns an empty object when there are no definitions and no input', () => {
    expect(validator.validate({}, [])).toEqual({});
    expect(validator.validate(null, [])).toEqual({});
    expect(validator.validate(undefined, [])).toEqual({});
  });

  it('rejects unknown attribute keys', () => {
    const defs = [def({ key: 'scent', dataType: AttributeDataType.text })];
    expect(() => validator.validate({ color: 'red' }, defs)).toThrow(
      BadRequestException,
    );
  });

  it('enforces required attributes', () => {
    const defs = [
      def({ key: 'scent', dataType: AttributeDataType.text, isRequired: true }),
    ];
    try {
      validator.validate({}, defs);
      fail('expected BadRequestException');
    } catch (err) {
      const res = (err as BadRequestException).getResponse() as {
        errors: string[];
      };
      expect(res.errors).toContain('Missing required attribute "scent"');
    }
  });

  it('allows a missing attribute when it is not required', () => {
    const defs = [def({ key: 'scent', dataType: AttributeDataType.text })];
    expect(validator.validate({}, defs)).toEqual({});
  });

  describe('type checking', () => {
    it('accepts a valid text value and rejects a non-string', () => {
      const defs = [def({ key: 'scent', dataType: AttributeDataType.text })];
      expect(validator.validate({ scent: 'lavender' }, defs)).toEqual({
        scent: 'lavender',
      });
      expect(() => validator.validate({ scent: 42 }, defs)).toThrow(
        BadRequestException,
      );
    });

    it('accepts finite numbers and rejects NaN/strings', () => {
      const defs = [def({ key: 'burn', dataType: AttributeDataType.number })];
      expect(validator.validate({ burn: 40 }, defs)).toEqual({ burn: 40 });
      expect(() => validator.validate({ burn: '40' }, defs)).toThrow(
        BadRequestException,
      );
      expect(() => validator.validate({ burn: NaN }, defs)).toThrow(
        BadRequestException,
      );
    });

    it('accepts booleans and rejects truthy strings', () => {
      const defs = [def({ key: 'gift', dataType: AttributeDataType.boolean })];
      expect(validator.validate({ gift: true }, defs)).toEqual({ gift: true });
      expect(() => validator.validate({ gift: 'true' }, defs)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('enum / multi_enum', () => {
    const enumDef = [
      def({
        key: 'size',
        dataType: AttributeDataType.enum,
        options: ['s', 'm', 'l'],
      }),
    ];

    it('accepts an allowed enum value', () => {
      expect(validator.validate({ size: 'm' }, enumDef)).toEqual({ size: 'm' });
    });

    it('rejects an enum value outside the options', () => {
      expect(() => validator.validate({ size: 'xl' }, enumDef)).toThrow(
        BadRequestException,
      );
    });

    const multiDef = [
      def({
        key: 'rooms',
        dataType: AttributeDataType.multi_enum,
        options: ['bath', 'kitchen', 'living'],
      }),
    ];

    it('accepts an array of allowed multi_enum values', () => {
      expect(validator.validate({ rooms: ['bath', 'kitchen'] }, multiDef)).toEqual(
        { rooms: ['bath', 'kitchen'] },
      );
    });

    it('rejects a multi_enum array containing a disallowed value', () => {
      expect(() =>
        validator.validate({ rooms: ['bath', 'garage'] }, multiDef),
      ).toThrow(BadRequestException);
    });

    it('rejects a non-array multi_enum value', () => {
      expect(() => validator.validate({ rooms: 'bath' }, multiDef)).toThrow(
        BadRequestException,
      );
    });
  });

  it('drops definitions that were not provided from the normalized output', () => {
    const defs = [
      def({ key: 'a', dataType: AttributeDataType.text }),
      def({ key: 'b', dataType: AttributeDataType.number }),
    ];
    expect(validator.validate({ a: 'x' }, defs)).toEqual({ a: 'x' });
  });
});
