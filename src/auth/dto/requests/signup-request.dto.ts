import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupRequestDto {
  @ApiProperty({
    example: 'test123',
    description: '사용자 ID (영문자+숫자, 숫자만 불가)',
    pattern: '^(?!\\d+$)[a-zA-Z0-9]+$',
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @Length(4, 20)
  @Matches(/^(?!\d+$)[a-zA-Z0-9]+$/, {
    message:
      'username은 숫자만으로 구성될 수 없으며, 영문자와 숫자만 사용할 수 있습니다.',
  })
  @IsNotEmpty({ message: 'username은 필수값입니다.' })
  username: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름 (2~30자)',
    minLength: 2,
    maxLength: 30,
  })
  @Length(2, 30, {
    message: '이름은 2자 이상 30자 이하로 입력해주세요.',
  })
  @IsNotEmpty({ message: 'name은 빈 문자열을 허용하지 않습니다.' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (8자 이상)',
    minLength: 8,
  })
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @IsNotEmpty({ message: 'password는 빈 문자열을 허용하지 않습니다.' })
  @IsString()
  password: string;
}
