import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateNameDto {
  @ApiProperty({
    example: '새로운닉네임',
    description: '변경할 이름 (최대 50자, 공백 불가)',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @Matches(/\S/, { message: 'name은 공백만으로 이루어질 수 없습니다.' })
  @IsNotEmpty({ message: 'name은 빈 문자열을 허용하지 않습니다.' })
  name: string;
}
