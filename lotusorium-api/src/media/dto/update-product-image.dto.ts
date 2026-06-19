import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProductImageDto {
  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
