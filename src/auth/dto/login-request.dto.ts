import { IsString, Length, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @Length(4, 20)
  userName: string;

  @IsString()
  @MinLength(8)
  password: string;
}
