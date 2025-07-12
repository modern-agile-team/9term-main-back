import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserInfoDto {
  @Expose()
  @ApiProperty({ example: 1, description: '작성자 ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: '강승민', description: '작성자 이름' })
  name: string;
}
