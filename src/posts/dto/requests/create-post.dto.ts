import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
