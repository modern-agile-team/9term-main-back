import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JoinMemberRequestDto } from './dto/member-request.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRepository } from './member.repository';

@Injectable()
export class MembersService {
  constructor(private readonly memberRepository: MemberRepository) {}

  async getMemberList(groupId: number): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.findAllMembersByGroup(groupId);

    return members
      .filter((member) => member.role !== 'admin')
      .map((member) => {
        if (!member.user) {
          throw new InternalServerErrorException('유저 정보가 없습니다.');
        }
        return {
          userId: member.userId,
          name: member.user.name,
          role: member.role,
          joinedAt: member.createdAt,
        };
      });
  }

  async getGroupMember(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto | null> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new NotFoundException('그룹 멤버가 존재하지 않습니다.');
    }
    return {
      userId: member.userId,
      name: member.user.name,
      role: member.role,
      joinedAt: member.createdAt,
    };
  }

  async removeMember(
    groupId: number,
    targetUserId: number,
  ): Promise<{ message: string }> {
    const targetMember = await this.memberRepository.findGroupMember(
      groupId,
      targetUserId,
    );
    if (!targetMember) {
      throw new NotFoundException('삭제할 멤버가 존재하지 않습니다.');
    }
    await this.memberRepository.deleteManyByGroupAndUser(
      targetMember.groupId,
      targetMember.userId,
    );
    return {
      message: '삭제가 완료되었습니다.',
    };
  }

  async joinGroup(
    dto: JoinMemberRequestDto & { userId: number },
  ): Promise<MemberResponseDto> {
    const { groupId, userId, role } = dto;
    const existingMembership = await this.memberRepository.findGroupMember(
      groupId,
      userId,
    );
    if (existingMembership) {
      throw new ConflictException('이미 이 그룹에 가입되어 있습니다.');
    }
    const joinGroupUser = await this.memberRepository.createMember({
      groupId,
      userId,
      role: role ?? 'member',
    });

    return {
      userId: joinGroupUser.userId,
      name: joinGroupUser.user.name,
      role: joinGroupUser.role,
      joinedAt: joinGroupUser.createdAt,
    };
  }
}
