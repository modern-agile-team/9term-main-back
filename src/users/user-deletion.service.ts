import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { S3Service } from 'src/s3/s3.service';
import { UsersRepository } from './users.repository';

export class UserDeletedEvent {
  constructor(
    public readonly userId: number,
    public readonly previousProfileImgKey?: string,
  ) {}
}

@Injectable()
export class UserDeletionService {
  private readonly logger = new Logger(UserDeletionService.name);
  private readonly defaultImageKeys: string[];

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
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

  async validateDeletionAllowed(userId: number): Promise<void> {
    const soleManagedGroups =
      await this.usersRepository.findGroupsWhereUserIsOnlyManager(userId);

    if (soleManagedGroups.length > 0) {
      const groupNames = soleManagedGroups.map((g) => g.groupName).join(', ');
      throw new ConflictException(
        `아직 다른 매니저가 없는 그룹이 있습니다: ${groupNames}. 그룹을 삭제하거나 매니저 권한을 위임한 뒤 다시 시도해주세요.`,
      );
    }
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.validateDeletionAllowed(userId);

    const previousProfileImgKey = user.profileImgPath;

    const anonymizedUsername = this.generateDeletedUsername(userId);
    const replacementImageKey = this.getRandomDefaultImageKey();

    await this.usersRepository.purgeUserDataExceptContent(userId, {
      username: anonymizedUsername,
      name: '탈퇴한 사용자',
      email: null,
      emailVerified: false,
      password: null,
      profileImgPath: replacementImageKey,
      nameChangedAt: null,
    });

    this.eventEmitter.emit(
      'user.deleted',
      new UserDeletedEvent(userId, previousProfileImgKey || undefined),
    );

    this.logger.log(`사용자 ${userId} 탈퇴 처리 완료`);
  }
}
