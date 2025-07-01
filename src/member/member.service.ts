import { Injectable, NotFoundException } from '@nestjs/common';
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

  async removeMember(id: number) {
    return this.prisma.userGroup.delete({
      where: { id },
    });
  }

  async processRemoveMember(groupId: number, targetUserId: number) {
    const targetMember = await this.prisma.userGroup.findFirst({
      where: {
        groupId,
        userId: targetUserId,
      },
    });
    if (!targetMember) {
      throw new NotFoundException('삭제할 멤버가 존재하지 않습니다.');
    }
    return this.removeMember(targetMember.id);
  }
}
