import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
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
import { MemberAction } from './dto/update-member-status.dto';

@Injectable()
export class MembersService {
  constructor(private readonly memberRepository: MemberRepository) {}

  async getMembersByGroup(
    groupId: number,
    status?: MembershipStatus,
  ): Promise<MemberResponseDto[]> {
    const filters = status ? { status } : undefined;
    const members = await this.memberRepository.findMembersByGroup(
      groupId,
      filters,
    );
    return this.transformToResponseDto(members);
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
}
