import { IsString, Length, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'test123',
    description: '사용자 ID',
    pattern: '^[a-zA-Z0-9]{4,20}$',
  })
  @IsString()
  @Length(4, 20, { message: 'userName은 4자 이상 20자 이하로 입력해주세요.' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'userName은 영문자와 숫자만 포함할 수 있습니다.',
  })
  @IsNotEmpty({ message: 'userName은 필수값입니다.' })
  userName: string;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호',
  })
  @IsString()
  @IsNotEmpty({ message: 'password는 필수값입니다.' })
  password: string;
}
