import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MemberRepository } from './member.repository';
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import {
  MembershipStatus,
  UserGroupRole,
  User,
  UserGroup as PrismaUserGroup,
} from '@prisma/client';

@Injectable()
export class MembersService {
  constructor(private readonly memberRepository: MemberRepository) {}

  async getMemberList(groupId: number): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.findMembersByGroup(groupId, {
      status: MembershipStatus.APPROVED,
    });
    return this.transformToResponseDto(members);
  }

  async getPendingMembers(groupId: number): Promise<MemberResponseDto[]> {
    const pendingMembers = await this.memberRepository.findMembersByGroup(
      groupId,
      {
        status: MembershipStatus.PENDING,
      },
    );

    return this.transformToResponseDto(pendingMembers);
  }

  async getAllMembersWithStatus(groupId: number): Promise<MemberResponseDto[]> {
    const allMembers = await this.memberRepository.findMembersByGroup(groupId);

    return this.transformToResponseDto(allMembers);
  }

  private transformToResponseDto(
    members: (PrismaUserGroup & { user: User })[],
  ): MemberResponseDto[] {
    return members.map((member) => {
      if (!member.user) {
        throw new InternalServerErrorException('유저 정보가 없습니다.');
      }
      return {
        userId: member.userId,
        name: member.user.name,
        role: member.role,
        joinedAt: member.createdAt,
        status: member.status,
      };
    });
  }

  async getGroupMember(
    groupId: number,
    userId: number,
  ): Promise<MemberResponseDto | null> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new NotFoundException('멤버가 존재하지 않습니다.');
    }
    return {
      userId: member.userId,
      name: member.user.name,
      role: member.role,
      joinedAt: member.createdAt,
      status: member.status,
    };
  }

  async leaveGroup(
    groupId: number,
    userId: number,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    const member = await this.memberRepository.findGroupMember(groupId, userId);

    if (!member) {
      throw new NotFoundException('멤버가 존재하지 않습니다.');
    }

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
      member: this.transformToResponseDto([updatedMember])[0],
    };
  }

  async joinGroup(
    dto: JoinMemberRequestDto & { userId: number },
  ): Promise<{ message: string; member: MemberResponseDto }> {
    const { groupId, userId, status = MembershipStatus.PENDING } = dto;

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
      member: this.transformToResponseDto([newMember])[0],
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

    return this.transformToResponseDto([updatedMember])[0];
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

    return this.transformToResponseDto([updatedMember])[0];
  }

  async getApprovedMembers(groupId: number): Promise<MemberResponseDto[]> {
    const approvedMembers = await this.memberRepository.findMembersByGroup(
      groupId,
      { status: MembershipStatus.APPROVED },
    );
    return this.transformToResponseDto(approvedMembers);
  }

  async getRejectedMembers(groupId: number): Promise<MemberResponseDto[]> {
    const rejectedMembers = await this.memberRepository.findMembersByGroup(
      groupId,
      { status: MembershipStatus.REJECTED },
    );
    return this.transformToResponseDto(rejectedMembers);
  }

  async getLeftMembers(groupId: number): Promise<MemberResponseDto[]> {
    const leftMembers = await this.memberRepository.findMembersByGroup(
      groupId,
      { status: MembershipStatus.LEFT },
    );
    return this.transformToResponseDto(leftMembers);
  }
}
