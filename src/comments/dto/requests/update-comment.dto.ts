import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: '수정할 댓글 내용 (선택사항)',
    example: '불참합니다!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
  @Transform(({ value }: { value: string }) => value.trim())
  content?: string;
}
