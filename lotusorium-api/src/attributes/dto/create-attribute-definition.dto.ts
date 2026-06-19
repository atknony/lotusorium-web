import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { AttributeDataType } from '@prisma/client';

export class CreateAttributeDefinitionDto {
  /** Machine name, e.g. "burn_time". Lowercase letters, digits, underscores. */
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message:
      'key must be snake_case (lowercase letters, digits, underscores; starting with a letter)',
  })
  @MaxLength(60)
  key: string;

  /** Display label, e.g. "Burn Time". */
  @IsString()
  @MaxLength(120)
  label: string;

  @IsEnum(AttributeDataType)
  dataType: AttributeDataType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  /** Allowed values; required for enum / multi_enum data types. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
