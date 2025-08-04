import { ApiProperty } from '@nestjs/swagger';
import { GroupResponseDto } from './group-response.dto';
import { Expose } from 'class-transformer';

export class GroupWithMemberCountDto extends GroupResponseDto {
  @ApiProperty({
    description: '그룹에 속한 총 멤버 수',
    example: 8,
  })
  @Expose()
  memberCount: number;

  @Expose()
  groupImageUrl: string;
}
