import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PublicProductsQueryDto {
  /** Filter by category slug. */
  @IsOptional()
  @IsString()
  category?: string;

  /** "true" to return only featured products. */
  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: string;

  /** Case-insensitive match against product name. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Attribute facets, e.g. ?attr[scent]=lavender&attr[burn_time]=40
   * Values are auto-coerced (boolean/number/string) against the JSONB column.
   */
  @IsOptional()
  @IsObject()
  attr?: Record<string, string | string[]>;
}
