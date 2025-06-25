import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupByName(name: string) {
    return await this.prisma.group.findFirst({
      where: { name },
      select: { id: true },
    });
  }

  async createGroupWithAdmin(data: {
    name: string;
    description: string;
    userId: number;
  }) {
    return await this.prisma.$transaction(async (tx) => {
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

  async findAllGroups() {
    return await this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findGroupById(groupId: number) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    if (!group) {
      return null;
    }

    const memberCount = await this.prisma.userGroup.count({
      where: { groupId },
    });

    return {
      ...group,
      memberCount,
    };
  }

  async findUserGroup(groupId: number, userId: number) {
    return await this.prisma.userGroup.findFirst({
      where: { groupId, userId },
      select: { role: true },
    });
  }

  async joinGroup(joinGroupData: JoinGroupDto) {
    return await this.prisma.userGroup.create({
      data: {
        userId: joinGroupData.userId,
        groupId: joinGroupData.groupId,
        role: joinGroupData.role,
      },
    });
  }

  async updateGroupById(groupId: number, updateGroupDto: UpdateGroupDto) {
    return await this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: updateGroupDto.name,
        description: updateGroupDto.description,
      },
    });
  }
}
