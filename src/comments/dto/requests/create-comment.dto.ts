import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '참석합니다!',
    required: true,
  })
  @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  content: string;

  @ApiProperty({
    description: '부모 댓글 ID (선택사항)',
    example: 1,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}
