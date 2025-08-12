import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRepository } from '../member.repository';
import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { MembershipStatus } from '@prisma/client';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly memberRepository: MemberRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId = Number(request.params.groupId);
    const { userId } = request.user as AuthenticatedUser;

    if (!Number.isFinite(groupId) || groupId <= 0) {
      throw new BadRequestException('유효한 groupId 값이 필요합니다.');
    }
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member || member.status !== MembershipStatus.APPROVED) {
      throw new ForbiddenException('승인된 그룹 멤버만 접근할 수 있습니다.');
    }

    return true;
  }
}
