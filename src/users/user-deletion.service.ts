import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from './users.repository';
import { MembersService } from '../member/member.service';
import { UsersService } from './users.service';

@Injectable()
export class UserDeletionService {
  private readonly logger = new Logger(UserDeletionService.name);
  private readonly defaultImageKeys: string[];

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly membersService: MembersService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const defaultImagesString = this.configService.get<string>(
      'DEFAULT_PROFILE_IMAGE_URL',
    );
    if (!defaultImagesString) {
      throw new Error('기본 프로필 이미지 URL 설정 오류');
    }
    this.defaultImageKeys = defaultImagesString.split(',');
  }

  private generateDeletedUsername(userId: number): string {
    const suffix = Date.now().toString(36).slice(-4);
    return `del${userId}${suffix}`.slice(0, 20);
  }

  private getRandomDefaultImageKey(): string {
    const randomIndex = Math.floor(
      Math.random() * this.defaultImageKeys.length,
    );
    return this.defaultImageKeys[randomIndex];
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.membersService.ensureUserHasNoSoleManagedGroups(userId);

    const previousProfileImgKey = user.profileImgPath;

    const hasCustomProfileImage =
      previousProfileImgKey &&
      !this.defaultImageKeys.includes(previousProfileImgKey);

    await this.usersRepository.purgeUserDataExceptContent(userId, {
      username: this.generateDeletedUsername(userId),
      name: '탈퇴한 사용자',
      email: null,
      emailVerified: false,
      password: null,
      nameChangedAt: null,
    });

    if (hasCustomProfileImage && previousProfileImgKey) {
      await this.usersService.resetProfileImage(userId);
    }

    this.logger.log(`사용자 ${userId} 탈퇴 처리 완료`);
  }
}
