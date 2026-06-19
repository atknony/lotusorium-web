import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateProductImageDto {
  /** Returned by Cloudinary after the direct upload. */
  @IsString()
  cloudinaryPublicId: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
