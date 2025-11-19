import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserProfileDto {
  @Expose()
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @Expose()
  @ApiProperty({ example: '정윤호', description: '사용자 이름' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'user123', description: '사용자 아이디' })
  username: string;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/profile/default_1.png',
    description: '프로필 이미지 URL',
  })
  profileImageUrl: string;
}

export class UserProfileNextDateDto extends UserProfileDto {
  @Expose()
  @ApiProperty({
    example: '2025-10-30T00:00:00.000Z',
    description: '다음 이름 변경 가능일 (없을 경우 null)',
    nullable: true,
  })
  nextAvailableDate: Date | null;
}
