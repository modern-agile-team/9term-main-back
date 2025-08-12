import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MemberAction } from '../member-action.enum';

export class UpdateMemberStatusDto {
  @ApiProperty({
    enum: MemberAction,
    example: MemberAction.APPROVE,
    description: '멤버에 대해 수행할 액션',
  })
  @IsEnum(MemberAction)
  action: MemberAction;
}
