import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: '게시물 제목',
    maxLength: 255,
    example: '2025년 6월 정모 안내',
  })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '제목은 비워둘 수 없습니다.' })
  @MaxLength(255, { message: '제목은 최대 255자까지 입력할 수 있습니다.' })
  title: string;

  @ApiProperty({
    description: '게시물 내용',
    example: '인덕대학교 도서관 10시에 모입니다!',
  })
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '내용은 비워둘 수 없습니다.' })
  content: string;
}
