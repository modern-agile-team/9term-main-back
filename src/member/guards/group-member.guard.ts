import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { MembersService } from '../member.service';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const groupId = Number(request.params.groupId);
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('로그인이 필요합니다.');
    }
    if (!groupId) {
      throw new ForbiddenException('그룹 정보가 올바르지 않습니다.');
    }
    const member = await this.membersService.getGroupMember(groupId, userId);
    if (!member) {
      throw new ForbiddenException('이 그룹에 가입된 멤버만 조회할 수 있습니다.');
    }

    return true;
  }
}