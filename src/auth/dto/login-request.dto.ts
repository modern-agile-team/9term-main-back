import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'test123',
    description: '사용자 ID',
  })
  @IsString()
  @Length(4, 20)
  userName: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsString()
  password: string;
}
