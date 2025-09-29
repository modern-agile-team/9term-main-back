import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OAuthProvider, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { OAuthInput } from './interfaces/oauth.interface';

@Injectable()
export class OAuthService {
  constructor(private readonly usersService: UsersService) {}

  async resolveUser(input: OAuthInput): Promise<User> {
    const { provider, providerId, email, emailVerified, displayName } = input;

    const account = await this.usersService.findOAuthAccount(
      provider,
      providerId,
    );

    if (account) {
      const user = await this.usersService.findUserById(account.userId);
      if (!user) {
        throw new InternalServerErrorException(
          '연결된 사용자 정보를 찾을 수 없습니다.',
        );
      }
      return user;
    }

    let user: User | null = email
      ? await this.usersService.findByEmail(email)
      : null;

    if (!user) {
      const username = this.generateUsername(provider, providerId);
      const resolvedDisplayName = (() => {
        if (displayName) {
          return displayName.trim().slice(0, 50);
        }
        if (email) {
          return email.split('@')[0].slice(0, 50);
        }
        return `${provider.toString().toLowerCase()}_user`;
      })();
      user = await this.usersService.createUser({
        username,
        name: resolvedDisplayName,
        email: email ?? null,
        emailVerified: emailVerified ?? false,
        password: null,
      });
    } else if (emailVerified && !user.emailVerified) {
      user = await this.usersService.updateUser(user.id, {
        emailVerified: true,
      });
    }

    if (!user) {
      throw new InternalServerErrorException('사용자 생성에 실패했습니다.');
    }

    await this.usersService.linkOAuthAccount(user.id, provider, providerId);

    return user;
  }

  private generateUsername(
    provider: OAuthProvider,
    providerId: string,
  ): string {
    const prefix = provider.toString().toLowerCase();
    const suffix = providerId.slice(-8);
    return `${prefix}_user${suffix}`;
  }
}
