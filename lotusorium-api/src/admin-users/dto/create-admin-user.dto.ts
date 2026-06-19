import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
