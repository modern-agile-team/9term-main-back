import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserInfoDto } from '../user-info.dto';

export class ResCommentDto {
  @Expose()
  @ApiProperty({ description: '댓글 ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: '댓글이 속한 게시물 ID', example: 456 })
  postId: number;

  @Expose()
  @ApiProperty({ description: '댓글 내용', example: '새 댓글입니다.' })
  content: string;

  @Expose()
  @ApiProperty({ description: '부모 댓글 ID (없을 경우 null)', example: null })
  parentId: number | null;

  @Expose()
  @ApiProperty({
    description: '댓글 생성 일자',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: '댓글 수정 일자 (수정되지 않았을 경우 null)',
    example: 'null',
    nullable: true,
  })
  updatedAt: Date | null;

  @Expose()
  @Type(() => UserInfoDto)
  @ApiProperty({
    type: UserInfoDto,
    description: '작성자 정보 (id, name)',
  })
  user: UserInfoDto;
}
