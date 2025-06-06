import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ example: 'admin11', description: '작성자 이름' })
  name: string;
}
