import { ApiProperty } from '@nestjs/swagger';

export class GroupBannerUrlDto {
  @ApiProperty({
    description: '배너 이미지 URL (없으면 null)',
    type: String,
    nullable: true,
    example: null,
  })
  bannerImageUrl!: string | null;
}
