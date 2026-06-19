import { IsArray, IsUUID } from 'class-validator';

export class SetFeaturedDto {
  /** Product IDs in the desired homepage order. Empty array clears all. */
  @IsArray()
  @IsUUID('all', { each: true })
  productIds: string[];
}
