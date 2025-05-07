import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserName(userName: string) {
    return this.prisma.user.findUnique({ where: { userName } });
  }
  async createUser(data: { userName: string; name: string; password: string }) {
    return this.prisma.user.create({ data });
  }
}
