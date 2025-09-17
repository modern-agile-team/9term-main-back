import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuthProvider, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/users.repository';
import { OAuthInput } from './interfaces/oauth.interface';

@Injectable()
export class OAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async resolveUser(input: OAuthInput): Promise<User> {
    const { provider, providerId, email, emailVerified, displayName } = input;

    const account = await this.usersRepository.findOAuthAccount(
      provider,
      providerId,
    );

    if (account) {
      const user = await this.usersRepository.findUserById(account.userId);
      if (!user) {
        throw new InternalServerErrorException(
          '연결된 사용자 정보를 찾을 수 없습니다.',
        );
      }
      return user;
    }

    let user: User | null = email
      ? await this.usersRepository.findByEmail(email)
      : null;

    if (!user) {
      const username = this.generateUsername(provider);
      const resolvedDisplayName =
        (displayName?.trim() && displayName.trim().slice(0, 50)) ||
        (email
          ? email.split('@')[0].slice(0, 50)
          : `${provider.toString().toLowerCase()}_user`);
      user = await this.usersService.createUser({
        username,
        name: resolvedDisplayName,
        email: email ?? null,
        emailVerified: emailVerified ?? false,
        password: null,
      });
    } else if (emailVerified && !user.emailVerified) {
      user = await this.usersRepository.updateUser(user.id, {
        emailVerified: true,
      });
    }

    await this.usersRepository.linkOAuthAccount(user.id, provider, providerId);

    return user;
  }

  private generateUsername(provider: OAuthProvider): string {
    const prefix = provider.toString().charAt(0).toLowerCase();
    const rand = Math.random().toString(36).slice(2, 10);
    const time = Date.now().toString(36).slice(-6);
    return `${prefix}_${time}${rand}`.slice(0, 20);
  }
}
