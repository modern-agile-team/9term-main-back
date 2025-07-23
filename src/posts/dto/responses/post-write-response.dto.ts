import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PostWriteResponseDto {
  @ApiProperty({ example: 1, description: '게시물 ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: 29, description: '작성자 ID' })
  @Expose()
  userId: number;

  @ApiProperty({ example: 5, description: '그룹 ID' })
  @Expose()
  groupId: number;

  @ApiProperty({ example: '제목', description: '게시물 제목' })
  @Expose()
  title: string;

  @ApiProperty({ example: '본문', description: '게시물 내용' })
  @Expose()
  content: string;

  @ApiProperty({ example: '2025-07-04T10:00:00Z', description: '작성일' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2025-07-04T10:00:00Z',
    description: '수정일',
    nullable: true,
  })
  @Expose()
  updatedAt: Date | null;

  @ApiProperty({
    example:
      'https://your-bucket.s3.ap-northeast-2.amazonaws.com/posts/uuid.jpeg',
    description: '게시물 이미지 URL (Presigned URL)',
    nullable: true,
  })
  @Expose()
  imageUrl: string | null;
}
