import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordClickDto {
  /** Optional client-supplied session id for de-duplication / funnels. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;
}
