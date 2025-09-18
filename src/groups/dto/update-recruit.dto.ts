import { IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GroupRecruitStatus } from '@prisma/client';

export class UpdateRecruitStatusDto {
  @ApiPropertyOptional({
    description: '수정할 그룹 모집 상태',
    enum: GroupRecruitStatus,
    example: GroupRecruitStatus.ALWAYS_OPEN,
  })
  @IsEnum(GroupRecruitStatus)
  recruitStatus: GroupRecruitStatus;
}
