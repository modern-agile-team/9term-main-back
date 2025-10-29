import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({
    description: '생성할 그룹의 이름',
    example: '프론트엔드 스터디',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '그룹에 대한 설명',
    example: 'React와 TypeScript를 공부하는 모임입니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
