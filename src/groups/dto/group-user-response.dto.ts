import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GroupUserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ description: '그룹 ID', example: 10 })
  @Expose()
  groupId: number;

  @ApiProperty({
    description: '그룹 내 역할',
    enum: ['admin', 'member'],
    example: 'member',
  })
  @Expose()
  role: 'admin' | 'member';
}
