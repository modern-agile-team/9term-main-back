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

  @ApiProperty({
    description: '그룹 이미지 사진',
    example: 'https://amazonaws.com/group_banner/1/default.png',
    nullable: true,
  })
  @Expose()
  groupImageUrl: string;

  @ApiProperty({
    description: '그룹 배너 이미지 사진',
    example: 'https://amazonaws.com/group_banner/1/default.png',
    nullable: true,
  })
  @Expose()
  groupBannerUrl: string | null;

  @ApiProperty({
    description: '모집 상태',
    enum: GroupRecruitStatus,
    example: GroupRecruitStatus.OPEN,
  })
  @Expose()
  recruitStatus: GroupRecruitStatus;
}
