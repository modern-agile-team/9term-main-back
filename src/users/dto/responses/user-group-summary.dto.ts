import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus, UserGroupRole } from '@prisma/client';

export class UserGroupSummaryDto {
  @ApiProperty({ example: 1 })
  groupId: number;

  @ApiProperty({ example: '스터디 그룹' })
  groupName: string;

  @ApiProperty({
    example: 'https://cdn.example.com/groups/1.png',
    nullable: true,
  })
  groupImgUrl: string | null;

  @ApiProperty({ enum: UserGroupRole, example: UserGroupRole.MEMBER })
  role: UserGroupRole;

  @ApiProperty({ enum: MembershipStatus, example: MembershipStatus.APPROVED })
  status: MembershipStatus;

  @ApiProperty({ example: '2025-08-21T12:34:56.000Z' })
  joinedAt: Date;
}
