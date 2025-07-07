import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PostCreateResponseDto } from './post-create-response.dto';
import { UserInfoDto } from '../user-info.dto';

export class PostResponseDto extends PostCreateResponseDto {
  @ApiProperty({
    type: () => UserInfoDto,
    description: '작성자 정보',
    required: false,
  })
  @Expose()
  @Type(() => UserInfoDto)
  user?: UserInfoDto;

  @ApiProperty({
    example: 3,
    description: '댓글 수',
    required: false,
  })
  @Expose()
  commentsCount?: number;
}
