import { IsString, Length, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupRequestDto {
  @ApiProperty({
    example: 'test123',
    description: '사용자 ID (영문자+숫자, 숫자만 불가)',
  })
  @IsString()
  @Length(4, 20)
  @Matches(/^(?!\d+$)[a-zA-Z0-9]+$/, {
    message:
      'userName은 숫자만으로 구성될 수 없으며, 영문자와 숫자만 사용할 수 있습니다.',
  })
  userName: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름 (2~30자)',
  })
  @IsString()
  @Length(2, 30)
  name: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (8자 이상)',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
