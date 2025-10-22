import { Injectable } from '@nestjs/common';
import {
  Prisma,
  User,
  MembershipStatus,
  OAuthAccount,
  OAuthProvider,
  UserGroupRole,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOAuthAccountsByUserId(userId: number): Promise<OAuthAccount[]> {
    return this.prisma.oAuthAccount.findMany({ where: { userId } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async deleteUserById(userId: number): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async purgeUserDataExceptContent(
    userId: number,
    anonymizedData: Prisma.UserUpdateInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.postLike.deleteMany({ where: { userId } });
      await tx.userGroup.deleteMany({ where: { userId } });
      await tx.userNotification.deleteMany({ where: { userId } });
      await tx.oAuthAccount.deleteMany({ where: { userId } });

      await tx.user.update({ where: { id: userId }, data: anonymizedData });
    });
  }

  async findOAuthAccount(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<OAuthAccount | null> {
    return this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
  }

  async findManagedGroups(
    userId: number,
  ): Promise<{ groupId: number; groupName: string }[]> {
    const managedGroups = await this.prisma.userGroup.findMany({
      where: {
        userId,
        role: UserGroupRole.MANAGER,
        status: MembershipStatus.APPROVED,
      },
      select: {
        groupId: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    return managedGroups.map((membership) => ({
      groupId: membership.groupId,
      groupName: membership.group.name,
    }));
  }

  async linkOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerId: string,
  ): Promise<void> {
    await this.prisma.oAuthAccount.upsert({
      where: { provider_providerId: { provider, providerId } },
      create: { provider, providerId, user: { connect: { id: userId } } },
      update: {},
    });
  }

  async findGroupsByUserWithStatus(userId: number, status?: MembershipStatus) {
    return this.prisma.userGroup.findMany({
      where: {
        userId,
        ...(status
          ? { status }
          : {
              status: {
                in: [MembershipStatus.PENDING, MembershipStatus.APPROVED],
              },
            }),
      },
      include: {
        group: { select: { id: true, name: true, groupImgPath: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
