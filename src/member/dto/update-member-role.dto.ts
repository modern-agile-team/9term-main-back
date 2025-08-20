import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserGroupRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserGroupRole, description: '변경할 역할' })
  @IsEnum(UserGroupRole, { message: '역할은 MEMBER 또는 MANAGER 여야 합니다.' })
  role!: UserGroupRole;
}
