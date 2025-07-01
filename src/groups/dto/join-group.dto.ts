import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinGroupDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '그룹 ID', example: 10 })
  @IsNumber()
  groupId: number;

  @ApiProperty({
    description: '그룹 내 역할',
    example: 'member',
  })
  @IsString()
  @IsNotEmpty()
  role: string;
}
