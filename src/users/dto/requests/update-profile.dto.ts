import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @MaxLength(50)
  @IsNotEmpty({ message: 'name은 빈 문자열을 허용하지 않습니다.' })
  name: string;
}
