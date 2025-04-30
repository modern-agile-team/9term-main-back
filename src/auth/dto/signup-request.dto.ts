import { IsString, Length, Matches, MinLength } from 'class-validator';

export class SignupRequestDto {
  @IsString()
  @Length(4, 20)
  @Matches(/^(?!\d+$).+$/, {
    message: 'userName은 숫자만으로 구성될 수 없습니다.',
  })
  userName: string;

  @IsString()
  @Length(2, 30)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
