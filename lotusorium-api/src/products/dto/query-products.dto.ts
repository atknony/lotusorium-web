import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class QueryProductsDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  /** Case-insensitive match against product name. */
  @IsOptional()
  @IsString()
  search?: string;
}
