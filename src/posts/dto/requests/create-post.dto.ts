import { IsString, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostCategory } from '@prisma/client';

export class CreatePostRequestDto {
  @ApiProperty({ example: '게시물 제목', description: '게시물 제목' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: '본문 내용', description: '게시물 본문' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: PostCategory.NORMAL,
    enum: PostCategory,
    description: '게시물 유형',
  })
  @IsEnum(PostCategory)
  @IsNotEmpty()
  category: PostCategory;
}
