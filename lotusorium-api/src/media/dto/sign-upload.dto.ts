import { IsOptional, IsString, Matches } from 'class-validator';

export class SignUploadDto {
  /** Optional Cloudinary folder; defaults to "lotusorium/products". */
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-/]+$/, {
    message: 'folder may contain letters, digits, underscores, hyphens, slashes',
  })
  folder?: string;
}
