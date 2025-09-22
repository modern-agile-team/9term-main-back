import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, UserGroupRole } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GroupsRepository } from '../groups/groups.repository';
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import {
  toMemberResponseDto,
  toMemberResponseList,
} from './mappers/member.mapper';
import { MemberAction } from './member-action.enum';
import { MemberRepository } from './member.repository';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureGroupExists(groupId: number): Promise<void> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException('그룹이 존재하지 않습니다.');
    }
  }

  private async getExistingMemberOrThrow(groupId: number, userId: number) {
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new NotFoundException('멤버가 존재하지 않습니다.');
    }
    return member;
  }
  async getMembersByGroup(
    groupId: number,
    status?: MembershipStatus,
  ): Promise<MemberResponseDto[]> {
    const filters = status ? { status } : undefined;
    const members = await this.memberRepository.findMembersByGroup(
      groupId,
      filters,
    );
    return toMemberResponseList(members);
  }

  async getGroupMember(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto> {
    const member = await this.getExistingMemberOrThrow(groupId, userId);
    return toMemberResponseDto(member);
  }

  async joinGroup(
    dto: JoinMemberRequestDto & { userId: number },
  ): Promise<MemberResponseDto> {
    const { groupId, userId, status = MembershipStatus.PENDING } = dto;
    await this.ensureGroupExists(groupId);

    const existingMembership = await this.memberRepository.findGroupMember(
      groupId,
      userId,
    );

    if (
      existingMembership &&
      (existingMembership.status === MembershipStatus.APPROVED ||
        existingMembership.status === MembershipStatus.PENDING)
    ) {
      throw new ConflictException('이미 신청 중이거나 가입된 그룹입니다.');
    }

    const newMember = await this.memberRepository.upsertMember({
      groupId,
      userId,
      role: UserGroupRole.MEMBER,
      status,
      leftAt:
        existingMembership &&
        existingMembership.status === MembershipStatus.LEFT
          ? null
          : undefined,
    });

    const managers = await this.memberRepository.findManagersByGroup(groupId);
    const managerIds = managers.map((m) => m.userId);

    try {
      await this.notificationsService.notifyByJoinRequest(
        { id: groupId, name: newMember.group.name },
        { id: userId, name: newMember.user.name },
        managerIds,
      );
    } catch (error) {
      this.logger.error(
        `가입 요청 알림 전송 실패: ${error.message}`,
        error.stack,
      );
    }

    return toMemberResponseDto(newMember);
  }

  async updateMemberStatus(
    groupId: number,
    targetUserId: number,
    action: MemberAction,
    actorUserId: number,
  ): Promise<MemberResponseDto> {
    switch (action) {
      case MemberAction.APPROVE: {
        const member = await this.approveMembership(groupId, targetUserId);
        return member;
      }
      case MemberAction.REJECT: {
        const member = await this.rejectMembership(groupId, targetUserId);
        return member;
      }
      case MemberAction.LEFT: {
        if (actorUserId !== targetUserId) {
          throw new ForbiddenException('본인만 탈퇴할 수 있습니다.');
        }
        return this.leaveGroup(groupId, targetUserId);
      }
      default: {
        throw new BadRequestException('올바르지 않은 액션입니다.');
      }
    }
  }

  async leaveGroup(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto> {
    const member = await this.getExistingMemberOrThrow(groupId, userId);

    if (member.status !== MembershipStatus.APPROVED) {
      throw new ConflictException('승인된 멤버만 그룹을 탈퇴할 수 있습니다.');
    }

    if (member.role === UserGroupRole.MANAGER) {
      throw new ConflictException('그룹 매니저는 탈퇴할 수 없습니다.');
    }

    const updatedMember = await this.memberRepository.updateMembershipStatus(
      groupId,
      userId,
      {
        status: MembershipStatus.LEFT,
        leftAt: new Date(),
      },
    );

    return toMemberResponseDto(updatedMember);
  }

  async approveMembership(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);

    if (!member || member.status !== MembershipStatus.PENDING) {
      throw new ConflictException(
        '가입 신청이 존재하지 않거나 이미 처리되었습니다.',
      );
    }

    const updatedMember = await this.memberRepository.updateMembershipStatus(
      groupId,
      userId,
      {
        status: MembershipStatus.APPROVED,
      },
    );

    return toMemberResponseDto(updatedMember);
  }

  async rejectMembership(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);

    if (!member || member.status !== MembershipStatus.PENDING) {
      throw new ConflictException(
        '가입 신청이 존재하지 않거나 이미 처리되었습니다.',
      );
    }

    const updatedMember = await this.memberRepository.updateMembershipStatus(
      groupId,
      userId,
      {
        status: MembershipStatus.REJECTED,
      },
    );

    return toMemberResponseDto(updatedMember);
  }

  async updateMemberRole(
    groupId: number,
    userId: number,
    targetUserId: number,
    { role }: UpdateMemberRoleDto,
  ): Promise<MemberResponseDto> {
    if (userId === targetUserId) {
      throw new ForbiddenException(
        '자기 자신의 역할은 이 API로 변경할 수 없습니다.',
      );
    }

    const member = await this.getExistingMemberOrThrow(groupId, targetUserId);
    if (member.status !== MembershipStatus.APPROVED) {
      throw new ForbiddenException('승인된 멤버만 역할을 변경할 수 있습니다.');
    }

    if (
      member.role === UserGroupRole.MANAGER &&
      role === UserGroupRole.MEMBER
    ) {
      const managerCount = await this.memberRepository.countManagers(groupId);
      if (managerCount <= 1) {
        throw new ConflictException(
          '마지막 매니저의 역할은 변경할 수 없습니다.',
        );
      }
    }

    const updated = await this.memberRepository.updateMembershipStatus(
      groupId,
      targetUserId,
      { role },
    );
    return toMemberResponseDto(updated);
  }
}
