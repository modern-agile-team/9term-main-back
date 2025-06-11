import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user-info.dto';

export class ResPostDto {
  @ApiProperty({ example: 6, description: '게시물 ID' })
  id: number;

  @ApiProperty({ example: 29, description: '작성자 사용자 ID' })
  userId: number;

  @ApiProperty({ example: 1, description: '게시물이 속한 그룹 ID' })
  groupId: number;

  @ApiProperty({ example: '수정테스트!!', description: '게시물 제목' })
  title: string;

  @ApiProperty({ example: '수정테스트!!', description: '게시물 내용' })
  content: string;

  @ApiProperty({
    example: '2025-05-16T02:35:57.282Z',
    description: '게시물 생성 일자 (ISO 8601 형식)',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-05-16T03:04:18.258Z',
    description: '게시물 수정 일자 (ISO 8601 형식)',
  })
  updatedAt: Date;

  @ApiProperty({
    type: UserInfoDto,
    description: '작성자 정보 (이름 등)',
  })
  user: UserInfoDto;
}
