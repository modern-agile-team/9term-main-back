import { IsString, Length, Matches, MinLength } from 'class-validator';

export class SignupRequestDto {
  @IsString()
  @Length(4, 20)
  @Matches(/^(?!\d+$)[a-zA-Z0-9]$/, {
    message:
      'userName은 숫자만으로 구성될 수 없으며, 영문자와 숫자만 사용할 수 있습니다.',
  })
  @Matches(/^\S+$/, {
    message: 'userName에는 공백이 포함될 수 없습니다.',
  })
  userName: string;

  @IsString()
  @Length(2, 30)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
