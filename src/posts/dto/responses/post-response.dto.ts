import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserInfoDto } from '../user-info.dto';
import { PostCategory } from '@prisma/client';

export class PostResponseDto {
  @ApiProperty({ example: 1, description: '게시물 ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: 5, description: '그룹 ID' })
  @Expose()
  groupId: number;

  @ApiProperty({
    type: () => UserInfoDto,
    required: false,
    description: '작성자 정보',
  })
  @Expose()
  @Type(() => UserInfoDto)
  user: UserInfoDto;

  @ApiProperty({ example: '2025-07-08T10:00:00Z', description: '작성일' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-08T10:00:00Z',
    description: '수정일',
    nullable: true,
  })
  @Expose()
  updatedAt: Date | null;

  @ApiProperty({ example: '제목', description: '게시물 제목' })
  @Expose()
  title: string;

  @ApiProperty({ example: '본문 내용', description: '게시물 내용' })
  @Expose()
  content: string;

  @ApiProperty({
    example: PostCategory.NORMAL,
    enum: PostCategory,
    description: '분류',
  })
  @Expose()
  category: PostCategory;

  @ApiProperty({
    example:
      'https://your-bucket.s3.ap-northeast-2.amazonaws.com/posts/uuid.jpeg',
    description: '게시물 이미지 URL (Presigned URL)',
    nullable: true,
  })
  @Expose()
  postImageUrl: string | null;

  @ApiProperty({ example: 3, required: true, description: '댓글 수' })
  @Expose()
  commentsCount: number;

  @ApiProperty({ example: 9, required: true, description: '좋아요 수' })
  @Expose()
  likesCount: number;

  @ApiProperty({ example: false, required: true, description: '좋아요 여부' })
  @Expose()
  isLiked: boolean;
}
