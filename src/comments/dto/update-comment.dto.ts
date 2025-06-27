import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
  @Transform(({ value }) => value.trim())
  content?: string;
}
