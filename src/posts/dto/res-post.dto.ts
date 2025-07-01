import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user-info.dto';

export class ResPostDto {
  @ApiProperty({ example: 6, description: '게시물 ID' })
  id: number;

  @ApiProperty({ example: 1, description: '그룹 ID' })
  groupId: number;

  @ApiProperty({ example: '제목', description: '게시물 제목' })
  title: string;

  @ApiProperty({ example: '본문', description: '게시물 내용' })
  content: string;

  @ApiProperty({ example: '2025-06-27T05:25:37.078Z', description: '작성일시' })
  createdAt: Date;

  @ApiProperty({ example: null, description: '수정일시' })
  updatedAt: Date | null;

  @ApiProperty({
    type: UserInfoDto,
    description: '작성자 정보 (id, name)',
  })
  user: UserInfoDto;

  @ApiProperty({ example: 3, description: '댓글 수' })
  commentsCount: number;
}
