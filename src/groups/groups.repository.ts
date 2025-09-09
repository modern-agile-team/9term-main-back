import { Injectable } from '@nestjs/common';
import {
  Group,
  Prisma,
  UserGroup,
  UserGroupRole,
  MembershipStatus,
  GroupRecruitStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateGroupInput,
  GroupUserInput,
  UpdateGroupInput,
} from './types/group-inputs';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGroupByName(name: string, tx?: TxClient): Promise<Group | null> {
    return (tx ?? this.prisma).group.findFirst({ where: { name } });
  }

  createGroupWithAdmin(data: CreateGroupInput): Promise<Group> {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          groupImgPath: data.groupImagePath,
        },
      });

      await tx.userGroup.create({
        data: {
          userId: data.userId,
          groupId: group.id,
          role: UserGroupRole.MANAGER,
          status: MembershipStatus.APPROVED,
        },
      });

      return group;
    });
  }

  findAllGroups(): Promise<(Group & { _count: { userGroups: number } })[]> {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            userGroups: { where: { status: MembershipStatus.APPROVED } },
          },
        },
      },
    });
  }

  findGroupById(groupId: number, tx?: TxClient): Promise<Group | null> {
    return (tx ?? this.prisma).group.findUnique({
      where: { id: groupId },
    });
  }

  getMemberCount(groupId: number, tx?: TxClient): Promise<number> {
    return (tx ?? this.prisma).userGroup.count({ where: { groupId } });
  }

  findGroupUser(
    groupId: number,
    userId: number,
    tx?: TxClient,
  ): Promise<UserGroup | null> {
    return (tx ?? this.prisma).userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
  }

  createGroupUser(data: GroupUserInput, tx?: TxClient): Promise<UserGroup> {
    return (tx ?? this.prisma).userGroup.create({ data });
  }

  updateGroupById(
    groupId: number,
    data: UpdateGroupInput,
    tx?: TxClient,
  ): Promise<Group> {
    return (tx ?? this.prisma).group.update({
      where: { id: groupId },
      data,
    });
  }

  async findGroupImagePath(
    groupId: number,
    tx?: TxClient,
  ): Promise<string | null> {
    const group = await (tx ?? this.prisma).group.findUnique({
      where: { id: groupId },
      select: { groupImgPath: true },
    });
    return group?.groupImgPath ?? null;
  }

  async setGroupImagePathIfEmpty(
    groupId: number,
    imageKey: string,
    tx?: TxClient,
  ): Promise<boolean> {
    const result = await (tx ?? this.prisma).group.updateMany({
      where: { id: groupId, groupImgPath: null },
      data: { groupImgPath: imageKey },
    });
    return result.count === 1;
  }

  async clearGroupImagePathIfPresent(
    groupId: number,
    tx?: TxClient,
  ): Promise<boolean> {
    const result = await (tx ?? this.prisma).group.updateMany({
      where: { id: groupId, groupImgPath: { not: null } },
      data: { groupImgPath: null },
    });
    return result.count === 1;
  }

  async deleteGroupById(groupId: number, tx?: TxClient): Promise<void> {
    await (tx ?? this.prisma).group.delete({
      where: { id: groupId },
    });
  }

  async updateRecruitStatusByGroupId(
    groupId: number,
    recruitStatus: GroupRecruitStatus,
  ): Promise<void> {
    await this.prisma.group.update({
      where: { id: groupId },
      data: { recruitStatus },
    });
  }
}
