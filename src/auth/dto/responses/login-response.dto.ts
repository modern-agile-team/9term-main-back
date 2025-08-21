import { ApiProperty } from '@nestjs/swagger';
import { AuthTokenDataDto } from './auth-response.dto';

export class LoginResponseDto {
  @ApiProperty({
    type: AuthTokenDataDto,
    description: '토큰 정보',
  })
  token: AuthTokenDataDto;
}
