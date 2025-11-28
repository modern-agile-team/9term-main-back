import { Injectable } from '@nestjs/common';
import {
  Prisma,
  User,
  UserGroup,
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

  async findByUsername(
    username: string,
    options?: { includeDeleted?: boolean },
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        username,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findUserById(
    id: number,
    options?: { includeDeleted?: boolean },
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findUserByEmail(
    email: string,
    options?: { includeDeleted?: boolean },
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async purgeUserDataExceptContent(
    userId: number,
    anonymizedData: Prisma.UserUpdateInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.postLike.deleteMany({ where: { userId } }),
        tx.userGroup.deleteMany({ where: { userId } }),
        tx.userNotification.deleteMany({ where: { userId } }),
        tx.oAuthAccount.deleteMany({ where: { userId } }),
      ]);

      const updateData = {
        ...anonymizedData,
        deletedAt: new Date(),
      } as Prisma.UserUncheckedUpdateInput;

      await tx.user.update({ where: { id: userId }, data: updateData });
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

  async linkOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerId: string,
  ): Promise<void> {
    await this.prisma.oAuthAccount.upsert({
      where: { provider_providerId: { provider, providerId } },
      create: { provider, providerId, user: { connect: { id: userId } } },
      update: { user: { connect: { id: userId } } },
    });
  }

  async findUserGroups(
    userId: number,
    role?: UserGroupRole,
    status?: MembershipStatus,
  ): Promise<UserGroup[]> {
    return this.prisma.userGroup.findMany({
      where: {
        userId,
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
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
