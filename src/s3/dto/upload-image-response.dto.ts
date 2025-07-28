import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    example: 'https://bucket.s3.amazonaws.com/profile/abc123.jpg',
  })
  imgUrl: string;

  constructor(url: string) {
    this.imgUrl = url;
  }
}
