import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { OAuthInput } from './interfaces/oauth.interface';

@Injectable()
export class OAuthService {
  constructor(private readonly usersService: UsersService) {}

  async resolveUser(input: OAuthInput): Promise<User> {
    const { provider, providerId } = input;
    // 1. 이미 OAath 계정이 연결되어 있는 경우 -> 바로 user 반환
    const account = await this.usersService.findOAuthAccount(
      provider,
      providerId,
    );

    if (account) {
      const user = await this.usersService.findUserById(account.userId);
      if (!user) {
        throw new NotFoundException('연결된 사용자 정보를 찾을 수 없습니다.');
      }
      return user;
    }

    // 2. 없으면 UserService에게 OAuthInput으로 유저를 찾아/만들어줘 요청
    const user = await this.usersService.getOrCreateUserFromOAuth(input);

    // 3. 계정 연결
    await this.usersService.linkOAuthAccount(user.id, provider, providerId);

    return user;
  }
}
