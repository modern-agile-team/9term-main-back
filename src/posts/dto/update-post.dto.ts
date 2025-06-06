import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiProperty({
    description: '게시물 제목 (수정 가능)',
    example: '수정된 제목입니다.',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: '게시물 내용 (수정 가능)',
    example: '수정된 내용입니다.',
    required: false,
  })
  content?: string;
}
