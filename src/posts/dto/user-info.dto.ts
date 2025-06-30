import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ example: 1, description: '작성자 ID' })
  id: number;

  @ApiProperty({ example: '정윤호', description: '작성자 이름' })
  name: string;
}
