import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserInfoDto {
  @ApiProperty({ example: 1, description: '작성자 ID' })
  @Expose()
  id: number;

  @ApiProperty({ example: '정윤호', description: '작성자 이름' })
  @Expose()
  name: string;

  @ApiProperty({
    example:
      'https://your-bucket.s3.ap-northeast-2.amazonaws.com/profile/uuid.jpeg',
    description: '프로필 이미지 URL (S3 public URL)',
    nullable: true,
  })
  @Expose()
  profileImageUrl: string | null;
}
