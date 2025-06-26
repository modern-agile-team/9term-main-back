import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberList(groupId: number) {
    const members = await this.prisma.userGroup.findMany({
      where: { groupId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members
      .filter((member) => member.role !== 'admin')
      .map((member) => ({
        userId: member.userId,
        name: member.user.name,
        role: member.role,
        joinedAt: member.createdAt,
      }));
  }

  async getGroupMember(groupId: number, userId: number) {
    return this.prisma.userGroup.findFirst({
      where: {
        groupId,
        userId,
      },
      include: {
        user: true,
      },
    });
  }

  async validateRemoveMember(
    groupId: number,
    targetUserId: number,
    requesterUserId: number,
  ) {
    if (targetUserId === requesterUserId) {
      throw new ForbiddenException('자신을 삭제할 수 없습니다.');
    }

    const requester = await this.prisma.userGroup.findFirst({
      where: {
        groupId,
        userId: requesterUserId,
      },
    });

    if (!requester || requester.role !== 'manager') {
      throw new ForbiddenException('매니저만 멤버를 삭제할 수 있습니다.');
    }

    const targetMember = await this.prisma.userGroup.findFirst({
      where: {
        groupId,
        userId: targetUserId,
      },
    });

    if (!targetMember) {
      throw new ForbiddenException('삭제할 멤버가 존재하지 않습니다.');
    }

    return targetMember;
  }

  async removeMember(
    groupId: number,
    targetUserId: number,
    requesterUserId: number,
  ) {
    const targetMember = await this.validateRemoveMember(
      groupId,
      targetUserId,
      requesterUserId,
    );

    return this.prisma.userGroup.delete({
      where: {
        id: targetMember.id,
      },
    });
  }
}
