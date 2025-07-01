import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GroupJoinStatusDto {
  @ApiProperty({
    description: '현재 로그인한 사용자가 해당 그룹에 가입했는지 여부',
    example: true,
  })
  @Expose()
  isJoined: boolean;

  @ApiProperty({
    description: '그룹 내 역할 (가입하지 않았을 경우 null)',
    enum: ['admin', 'member', null],
    example: 'member',
  })
  @Expose()
  role: 'admin' | 'member' | null;
}
