import { ApiProperty } from '@nestjs/swagger';

export class MemberResponseDto {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: '정윤호', description: '사용자 이름' })
  name: string;

  @ApiProperty({ example: 'member', description: '그룹 내 역할' })
  role: string;

  @ApiProperty({
    example: '2024-07-02T12:34:56.000Z',
    description: '가입 일시',
  })
  joinedAt: Date;
  @ApiProperty({
    example: 'APPROVED',
    description: '멤버십 상태 (예: APPROVED, PENDING, REJECTED)',
  })
  status: string;
}
