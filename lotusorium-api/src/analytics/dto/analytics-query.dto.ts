import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsQueryDto {
  /** ISO date; inclusive lower bound for click events. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** ISO date; inclusive upper bound for click events. */
  @IsOptional()
  @IsDateString()
  to?: string;
}
