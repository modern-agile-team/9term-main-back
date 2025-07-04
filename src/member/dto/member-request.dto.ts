import { ApiProperty } from '@nestjs/swagger';

export class MemberRequestDto {
  @ApiProperty({ example: 10, description: '그룹 ID' })
  groupId: number;

  @ApiProperty({
    example: 'member',
    description: '그룹 내 역할',
    required: false,
  })
  role?: string;
}
