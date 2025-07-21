import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserGroup } from './interfaces/member.interface';

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupMember(
    groupId: number,
    userId: number,
  ): Promise<(UserGroup & { user: User }) | null> {
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

  async findAllMembersByGroup(
    groupId: number,
  ): Promise<(UserGroup & { user?: { name: string } })[]> {
    return this.prisma.userGroup.findMany({
      where: { groupId },
      include: {
        user: true,
      },
    });
  }

  async createMember(data: { groupId: number; userId: number; role: string }) {
    return this.prisma.userGroup.create({
      data: {
        groupId: data.groupId,
        userId: data.userId,
      },
      include: {
        user: true,
      },
    });
  }

  async deleteManyByGroupAndUser(groupId: number, userId: number) {
    return this.prisma.userGroup.deleteMany({
      where: { groupId, userId },
    });
  }
}
