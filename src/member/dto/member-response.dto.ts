import { ApiProperty } from '@nestjs/swagger';
import { UserGroupRole, MembershipStatus } from '@prisma/client';

export class MemberResponseDto {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: '정윤호', description: '사용자 이름' })
  name: string;

  @ApiProperty({
    enum: UserGroupRole,
    example: UserGroupRole.MEMBER,
    description: '그룹 내 역할',
  })
  role: UserGroupRole;

  @ApiProperty({
    example: '2024-07-02T12:34:56.000Z',
    description: '가입 일시',
  })
  joinedAt: Date;

  @ApiProperty({
    enum: MembershipStatus,
    example: MembershipStatus.APPROVED,
    description: '멤버십 상태',
  })
  status: MembershipStatus;
}
