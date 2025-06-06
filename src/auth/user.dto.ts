import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'wjddbsgh15', description: '사용자 아이디' })
  name: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: '내 정보 조회 성공' })
  message: string;

  @ApiProperty({ type: UserProfileDto })
  data: UserProfileDto;
}
