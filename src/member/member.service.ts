import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRepository } from './member.repository';
import { GroupsRepository } from '../groups/groups.repository';
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MembershipStatus, UserGroupRole } from '@prisma/client';
import { MemberAction } from './member-action.enum';
import {
  toMemberResponseDto,
  toMemberResponseList,
} from './mappers/member.mapper';

@Injectable()
export class MembersService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly groupsRepository: GroupsRepository,
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

  async getMembersByGroupWithStatusString(
    groupId: number,
    status?: string,
  ): Promise<MemberResponseDto[]> {
    if (!status) {
      return this.getMembersByGroup(groupId);
    }
    const statusEnum =
      MembershipStatus[status as keyof typeof MembershipStatus];
    if (!statusEnum) {
      throw new BadRequestException(`유효하지 않은 status 값입니다: ${status}`);
    }
    return this.getMembersByGroup(groupId, statusEnum);
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
  ): Promise<{ message: string; member: MemberResponseDto }> {
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
    });

    return {
      message: '가입 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.',
      member: toMemberResponseDto(newMember),
    };
  }

  async updateMemberStatus(
    groupId: number,
    userId: number,
    action: MemberAction,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    switch (action) {
      case MemberAction.APPROVE: {
        const member = await this.approveMembership(groupId, userId);
        return { message: '가입 신청이 승인되었습니다.', member };
      }
      case MemberAction.REJECT: {
        const member = await this.rejectMembership(groupId, userId);
        return { message: '가입 신청이 거절되었습니다.', member };
      }
      case MemberAction.LEFT: {
        return this.leaveGroup(groupId, userId);
      }
      default: {
        throw new BadRequestException('올바르지 않은 액션입니다.');
      }
    }
  }

  async leaveGroup(
    groupId: number,
    userId: number,
  ): Promise<{ message: string; member: MemberResponseDto }> {
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

    return {
      message: '그룹을 탈퇴했습니다.',
      member: toMemberResponseDto(updatedMember),
    };
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
}
