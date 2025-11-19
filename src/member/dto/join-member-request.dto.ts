import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class JoinMemberRequestDto {
  @ApiProperty({ example: 10, description: '그룹 ID' })
  groupId: number;

  @ApiProperty({
    example: 'member',
    description: '그룹 내 역할',
    required: false,
  })
  role?: string;

  @ApiProperty({
    enum: MembershipStatus,
    example: MembershipStatus.PENDING,
    description: '초기 멤버십 상태',
    required: true,
  })
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}
