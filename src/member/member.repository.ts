import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MembershipStatus,
  UserGroupRole,
  User,
  UserGroup as PrismaUserGroup,
} from '@prisma/client';

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupMember(
    groupId: number,
    userId: number,
  ): Promise<(PrismaUserGroup & { user: User }) | null> {
    return this.prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  async findMembersByGroup(
    groupId: number,
    filters?: {
      status?: MembershipStatus;
      role?: UserGroupRole;
    },
  ): Promise<(PrismaUserGroup & { user: User })[]> {
    return this.prisma.userGroup.findMany({
      where: {
        groupId,
        ...filters,
      },
      include: {
        user: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async upsertMember(data: {
    groupId: number;
    userId: number;
    role: UserGroupRole;
    status: MembershipStatus;
    leftAt?: Date | null;
  }) {
    return this.prisma.userGroup.upsert({
      where: {
        userId_groupId: {
          userId: data.userId,
          groupId: data.groupId,
        },
      },
      update: {
        role: data.role,
        status: data.status,
        ...(data.leftAt !== undefined ? { leftAt: data.leftAt } : {}),
      },
      create: data,
      include: {
        user: true,
      },
    });
  }

  async updateMembershipStatus(
    groupId: number,
    userId: number,
    data: {
      status?: MembershipStatus;
      leftAt?: Date | null;
      role?: UserGroupRole;
    },
  ) {
    return this.prisma.userGroup.update({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      data,
      include: {
        user: true,
      },
    });
  }

  async countManagers(groupId: number): Promise<number> {
    return this.prisma.userGroup.count({
      where: {
        groupId,
        role: UserGroupRole.MANAGER,
        status: MembershipStatus.APPROVED,
      },
    });
  }
}
