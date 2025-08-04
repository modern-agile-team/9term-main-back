import { Expose } from 'class-transformer';

export class CreateGroupImageDto {
  @Expose()
  imageKey!: string;

  @Expose()
  imageUrl!: string;
}
