import { ApiProperty } from '@nestjs/swagger';
import { GroupResponseDto } from './group-response.dto';
import { Expose } from 'class-transformer';
import { GroupRecruitStatus } from '@prisma/client';

export class GroupWithMemberCountDto extends GroupResponseDto {
  @ApiProperty({
    description: '그룹에 속한 총 멤버 수',
    example: 8,
  })
  @Expose()
  memberCount: number;

  @Expose()
  groupImageUrl: string;

  @ApiProperty({
    description: '모집 상태',
    enum: GroupRecruitStatus,
    example: GroupRecruitStatus.RECRUITING,
  })
  @Expose()
  recruitStatus: GroupRecruitStatus;
}
