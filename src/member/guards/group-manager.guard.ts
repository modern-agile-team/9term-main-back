import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MembersService } from '../member.service';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UserGroupRole } from '@prisma/client';

@Injectable()
export class GroupManagerGuard implements CanActivate {
  constructor(private readonly membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId: number = Number(request.params.groupId);
    const user = request.user as AuthenticatedUser;
    const userId = user.userId;

    if (!groupId) {
      throw new BadRequestException('groupId 값이 필요합니다.');
    }
    const member = await this.membersService.getGroupMember(groupId, userId);
    if (!member || member.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('이 그룹의 매니저만 접근할 수 있습니다.');
    }

    return true;
  }
}
