import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostRequestDto {
  @ApiPropertyOptional({ example: '수정된 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: '수정된 본문' })
  @IsOptional()
  @IsString()
  content?: string;
}
