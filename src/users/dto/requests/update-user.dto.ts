import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateUserDto {
  @Expose()
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '업로드할 프로필 이미지 파일',
  })
  profileimgPath: any;
}
