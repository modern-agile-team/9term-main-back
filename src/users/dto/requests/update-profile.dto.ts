import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @MaxLength(50)
  @Matches(/\S/, { message: 'name은 공백만으로 이루어질 수 없습니다.' })
  @IsNotEmpty({ message: 'name은 빈 문자열을 허용하지 않습니다.' })
  name: string;
}
