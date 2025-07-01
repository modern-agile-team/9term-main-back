import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GroupResponseDto {
  @ApiProperty({ description: '그룹 ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: '그룹 이름', example: '프론트엔드 스터디' })
  @Expose()
  name: string;

  @ApiProperty({
    description: '그룹 설명',
    example: 'React와 TypeScript를 공부하는 모임입니다.',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: '그룹 생성 일자',
    example: '2025-06-30T12:34:56.789Z',
  })
  @Expose()
  createdAt: Date;
}
