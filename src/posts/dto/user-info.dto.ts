import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserInfoDto {
  @ApiProperty({ example: 1, description: '작성자 ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: '정윤호', description: '작성자 이름' })
  @Expose()
  name: string;
}
