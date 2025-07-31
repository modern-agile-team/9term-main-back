import { Injectable } from '@nestjs/common';
import { Group, Prisma, UserGroup } from '@prisma/client';
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

  findGroupByName(name: string): Promise<Group | null> {
    return this.prisma.group.findFirst({ where: { name } });
  }

  createGroupWithAdmin(data: CreateGroupInput): Promise<Group> {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      await tx.userGroup.create({
        data: {
          userId: data.userId,
          groupId: group.id,
          role: 'admin',
        },
      });

      return group;
    });
  }

  findAllGroups(): Promise<Group[]> {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findGroupById(groupId: number, tx?: TxClient): Promise<Group | null> {
    return (tx ?? this.prisma).group.findUnique({
      where: { id: groupId },
    });
  }

  getMemberCount(groupId: number): Promise<number> {
    return this.prisma.userGroup.count({
      where: { groupId },
    });
  }

  findGroupUser(groupId: number, userId: number): Promise<UserGroup | null> {
    return this.prisma.userGroup.findFirst({
      where: { groupId, userId },
    });
  }

  createGroupUser(data: GroupUserInput): Promise<UserGroup> {
    return this.prisma.userGroup.create({ data });
  }

  updateGroupById(groupId: number, data: UpdateGroupInput): Promise<Group> {
    return this.prisma.group.update({
      where: { id: groupId },
      data,
    });
  }
}
