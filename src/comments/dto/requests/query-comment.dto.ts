import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryCommentDto {
  @ApiProperty({
    description: '부모 댓글 ID로 필터링 (선택사항)',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'parentId는 1 이상의 숫자여야 합니다.' })
  parentId?: number; // 부모 댓글 ID로 필터링
}
