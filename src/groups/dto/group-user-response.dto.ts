import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserGroupRole } from '@prisma/client';

export class GroupUserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @Expose()
  userId: number;

  @ApiProperty({ description: '그룹 ID', example: 10 })
  @Expose()
  groupId: number;

  @ApiProperty({
    description: '그룹 내 역할',
    enum: [UserGroupRole],
    example: UserGroupRole.MEMBER,
  })
  @Expose()
  role: UserGroupRole;
}
