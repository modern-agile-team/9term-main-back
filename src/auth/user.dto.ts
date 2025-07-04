import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  userId: number;

  @ApiProperty({ example: '정윤호', description: '사용자 아이디' })
  name: string;

  @ApiProperty({ example: 'user123', description: '사용자 이름' })
  userName: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: '내 정보 조회 성공' })
  message: string;

  @ApiProperty({ type: UserProfileDto })
  data: UserProfileDto;
}
