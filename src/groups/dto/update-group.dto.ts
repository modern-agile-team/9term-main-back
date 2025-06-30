import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGroupDto {
  @ApiPropertyOptional({
    description: '수정할 그룹 이름',
    example: '백엔드 스터디',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '수정할 그룹 설명',
    example: 'NestJS와 TypeORM을 공부하는 모임입니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
