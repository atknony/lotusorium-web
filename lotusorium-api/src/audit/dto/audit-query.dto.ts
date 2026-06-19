import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AuditQueryDto {
  /** Filter by the acting admin's id. */
  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  /** Case-sensitive substring match against the action label. */
  @IsOptional()
  @IsString()
  action?: string;

  /** ISO-8601 lower bound (inclusive) on createdAt. */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** ISO-8601 upper bound (inclusive) on createdAt. */
  @IsOptional()
  @IsISO8601()
  to?: string;

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
}
