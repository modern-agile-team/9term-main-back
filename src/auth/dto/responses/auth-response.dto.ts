import { ApiProperty } from '@nestjs/swagger';

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
