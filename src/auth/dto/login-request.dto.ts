import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'test123',
    description: '사용자 ID',
    pattern: '^[a-zA-Z0-9]{4,20}$',
  })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'userName은 영문자와 숫자만 포함할 수 있습니다.',
  })
  @Length(4, 20, { message: 'userName은 4자 이상 20자 이하로 입력해주세요.' })
  @IsNotEmpty({ message: 'userName은 빈 문자열을 허용하지 않습니다.' })
  @IsString()
  userName: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsNotEmpty({ message: 'password는 빈 문자열을 허용하지 않습니다.' })
  @IsString()
  password: string;
}
