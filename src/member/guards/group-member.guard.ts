import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MembersService } from '../member.service';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId = Number(request.params.groupId);
    const user = request.user as AuthenticatedUser;
    const userId = user?.userId;

    if (!groupId) {
      throw new InternalServerErrorException('groupId 값이 필요합니다.');
    }
    const member = await this.membersService.getGroupMember(groupId, userId);
    if (!member) {
      throw new ForbiddenException(
        '이 그룹에 가입된 멤버만 접근할 수 있습니다.',
      );
    }

    return true;
  }
}
