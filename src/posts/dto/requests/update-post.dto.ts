import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostCategory } from '@prisma/client';

export class UpdatePostRequestDto {
  @ApiPropertyOptional({ example: '수정된 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '수정된 본문' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: '수정된 게시물 유형' })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;
}
