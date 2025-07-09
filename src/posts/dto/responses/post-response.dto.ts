import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserInfoDto } from '../user-info.dto';

// post-response.dto.ts
export class PostResponseDto {
  @ApiProperty({ example: 1, description: '게시물 ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: 5, description: '그룹 ID' })
  @Expose()
  groupId: number;

  @ApiProperty({ example: '제목', description: '게시물 제목' })
  @Expose()
  title: string;

  @ApiProperty({ example: '본문 내용', description: '게시물 내용' })
  @Expose()
  content: string;

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

  @ApiProperty({
    type: () => UserInfoDto,
    required: false,
    description: '작성자 정보',
  })
  @Expose()
  @Type(() => UserInfoDto)
  user: UserInfoDto;

  @ApiProperty({ example: 3, required: false, description: '댓글 수' })
  @Expose()
  commentsCount: number;
}
