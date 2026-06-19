import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  /** Image IDs in the desired display order. */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderedIds: string[];
}
