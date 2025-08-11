import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserProfileDto {
  @Expose()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @Expose()
  @ApiProperty({ example: '정윤호', description: '사용자 이름' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'user123', description: '사용자 아이디' })
  username: string;
}
