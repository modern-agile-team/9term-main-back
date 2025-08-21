import { Injectable } from '@nestjs/common';
import { Prisma, User, MembershipStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateUserInput,
  IUsersRepository,
} from './interfaces/users.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findGroupsByUser(userId: number, status?: MembershipStatus) {
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
