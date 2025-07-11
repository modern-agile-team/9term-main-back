import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthTokenDataDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...',
    description: '액세스 토큰',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...',
    description: '리프레시 토큰',
    required: false,
  })
  refreshToken?: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'success', description: '응답 상태' })
  status: string;

  @ApiProperty({
    example: '로그인에 성공했습니다.',
    description: '응답 메시지',
  })
  message: string;

  @ApiPropertyOptional({
    type: AuthTokenDataDto,
    description: '토큰 데이터(회원가입 시 null, 로그인/리프레시 시 토큰 정보)',
    nullable: true,
  })
  data?: AuthTokenDataDto | null;
}
