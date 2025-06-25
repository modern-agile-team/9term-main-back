import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class JoinGroupDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  groupId: number;

  @IsString()
  @IsNotEmpty()
  role: string;
}
