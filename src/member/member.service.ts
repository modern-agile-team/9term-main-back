import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MemberRepository } from './member.repository';
import { MemberRequestDto } from './dto/member-request.dto';
import { MemberResponseDto } from './dto/member-response.dto';

@Injectable()
export class MembersService {
  constructor(private readonly memberRepository: MemberRepository) {}

  async getMemberList(groupId: number): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.findAllMembersByGroup(groupId);

    return members
      .filter((member) => member.role !== 'admin')
      .map((member) => ({
        userId: member.userId,
        name: member.user?.name ?? '',
        role: member.role,
        joinedAt: member.createdAt,
      }));
  }

  async getGroupMember(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto | null> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member) {
      return null;
    }
    return {
      userId: member.userId,
      name: member.user?.name ?? '',
      role: member.role,
      joinedAt: member.createdAt,
    };
  }

  async processRemoveMember(
    groupId: number,
    targetUserId: number,
  ): Promise<MemberResponseDto> {
    const targetMember = await this.memberRepository.findGroupMember(
      groupId,
      targetUserId,
    );
    if (!targetMember) {
      throw new NotFoundException('삭제할 멤버가 존재하지 않습니다.');
    }
    await this.removeMember(targetMember.groupId, targetMember.userId);
    return {
      userId: targetMember.userId,
      name: targetMember.user?.name ?? '',
      role: targetMember.role,
      joinedAt: targetMember.createdAt,
    };
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    await this.memberRepository.deleteMember(groupId, userId);
  }

  async joinGroup(
    dto: MemberRequestDto & { userId: number },
  ): Promise<MemberResponseDto> {
    const { groupId, userId, role } = dto;
    const existingMembership = await this.memberRepository.findGroupMember(
      groupId,
      userId,
    );
    if (existingMembership) {
      throw new ConflictException('이미 이 그룹에 가입되어 있습니다.');
    }
    const createdGroupUser = await this.memberRepository.createMember({
      groupId,
      userId,
      role: role ?? 'member',
    });

    return {
      userId: createdGroupUser.userId,
      name: createdGroupUser.user?.name ?? '',
      role: createdGroupUser.role,
      joinedAt: createdGroupUser.createdAt,
    };
  }
}
