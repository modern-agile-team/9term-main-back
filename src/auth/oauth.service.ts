import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuthProvider, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { OAuthInput } from './interfaces/oauth.interface';

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async resolveUser(input: OAuthInput): Promise<User> {
    const { provider, providerId, email, emailVerified } = input;

    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });

    if (account) {
      const user = await this.prisma.user.findUnique({
        where: { id: account.userId },
      });
      if (!user) {
        throw new InternalServerErrorException(
          '연결된 사용자 정보를 찾을 수 없습니다.',
        );
      }
      return user;
    }

    let user: User | null = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;

    if (!user) {
      const username = this.generateUsername(provider);
      const displayName = email
        ? email.split('@')[0].slice(0, 50)
        : `${provider.toString().toLowerCase()}_user`;
      user = await this.usersService.createUser({
        username,
        name: displayName,
        email: email ?? null,
        emailVerified: emailVerified ?? false,
        password: null,
      });
    } else if (emailVerified && !user.emailVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    await this.prisma.oAuthAccount.upsert({
      where: { provider_providerId: { provider, providerId } },
      create: { provider, providerId, user: { connect: { id: user.id } } },
      update: {},
    });

    return user;
  }

  private generateUsername(provider: OAuthProvider): string {
    const prefix = provider.toString().charAt(0).toLowerCase();
    const rand = Math.random().toString(36).slice(2, 10);
    const time = Date.now().toString(36).slice(-6);
    return `${prefix}_${time}${rand}`.slice(0, 20);
  }
}
