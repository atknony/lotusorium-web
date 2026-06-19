import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FulfillmentChannel, ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  /** Optional; auto-generated from `name` when omitted. */
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sku?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  /** Dynamic attribute values; validated against the category's definitions. */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsUrl()
  trendyolUrl?: string;

  @IsOptional()
  @IsEnum(FulfillmentChannel)
  fulfillmentChannel?: FulfillmentChannel;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  featuredSortOrder?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  priceCurrency?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;
}
