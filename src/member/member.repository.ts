import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserGroup } from './interfaces/member.interface';

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGroupMember(
    groupId: number,
    userId: number,
  ): Promise<UserGroup | null> {
    return this.prisma.userGroup.findFirst({
      where: {
        groupId,
        userId,
      },
    });
  }

  async findAllMembersByGroup(groupId: number): Promise<UserGroup[]> {
    return this.prisma.userGroup.findMany({
      where: { groupId },
    });
  }

  async deleteMemberById(id: number) {
    return this.prisma.userGroup.delete({
      where: { id },
    });
  }
}
