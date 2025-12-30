import { ApiProperty } from '@nestjs/swagger';
import { PostCategory } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePostRequestDto {
  @ApiProperty({ example: '첫 번째 글', description: '게시물 제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    example: '안녕하세요! 본문 내용입니다. ',
    description: '게시물 본문',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: PostCategory.NORMAL,
    enum: PostCategory,
    description: '게시물 분류 (예: NORMAL, ANNOUNCEMENT)',
  })
  @IsEnum(PostCategory)
  @IsOptional()
  category?: PostCategory = PostCategory.NORMAL;

  // Swagger 전용 필드 (파일은 @UploadedFile로 처리됨)
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: '업로드할 이미지 파일',
  })
  postImage?: any;
}
