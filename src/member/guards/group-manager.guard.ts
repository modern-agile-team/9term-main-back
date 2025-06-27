import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MembersService } from '../member.service';
import { Request } from 'express';
import { GroupMember } from '../interfaces/member.interface';

@Injectable()
export class GroupManagerGuard implements CanActivate {
  constructor(private readonly membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId: number = Number(request.params.groupId);
    const userId: number | undefined = (request.user as GroupMember)?.userId;

    if (!userId) {
      throw new ForbiddenException('로그인이 필요합니다.');
    }
    if (!groupId) {
      throw new InternalServerErrorException('groupId 값이 필요합니다.');
    }
    const member = await this.membersService.getGroupMember(groupId, userId);
    if (!member || (member.role !== 'manager' && member.role !== 'admin')) {
      throw new ForbiddenException(
        '이 그룹의 매니저 또는 어드민만 접근할 수 있습니다.',
      );
    }

    return true;
  }
}
