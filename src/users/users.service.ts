import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MembershipStatus,
  OAuthAccount,
  OAuthProvider,
  Prisma,
  User,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { OAuthInput } from 'src/auth/interfaces/oauth.interface';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';
import { UserGroupSummaryDto } from 'src/users/dto/responses/user-group-summary.dto';
import { UserProfileDto } from 'src/users/dto/responses/user-profile.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly defaultImageKeys: string[];

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    const defaultImagesString = this.configService.get<string>(
      'DEFAULT_PROFILE_IMAGE_URL',
    );
    if (!defaultImagesString) {
      throw new InternalServerErrorException(
        '기본 프로필 이미지 URL 설정 오류',
      );
    }
    this.defaultImageKeys = defaultImagesString.split(',');
  }

  // oauthinput을 받아 user 엔티티 반환 (없으면 생성, 있으면 이메일 검증 업데이트)
  async getOrCreateUserFromOAuth(input: OAuthInput): Promise<User> {
    const { provider, providerId, email, emailVerified, displayName } = input;

    const user = email ? await this.findByEmail(email) : null;

    if (!user) {
      const username = this.generateUsername(provider, providerId);
      const resolvedDisplayName =
        displayName?.trim().slice(0, 50) ??
        email?.split('@')[0].slice(0, 50) ??
        `${provider.toString().toLowerCase()}_user`;

      return await this.createUser({
        username,
        name: resolvedDisplayName,
        email: email ?? null,
        emailVerified,
        password: null,
      });
    }

    if (emailVerified && !user.emailVerified) {
      return await this.updateUser(user.id, { emailVerified: true });
    }

    // dead code: 이미 prisma에서 create 했으므로 null을 반환할 수 없어서 삭제함 (20250930)

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findUserByEmail(email);
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.usersRepository.updateUser(id, data);
  }

  async findOAuthAccount(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<OAuthAccount | null> {
    return this.usersRepository.findOAuthAccount(provider, providerId);
  }

  async linkOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerId: string,
  ): Promise<void> {
    return this.usersRepository.linkOAuthAccount(userId, provider, providerId);
  }

  private toUserProfileDto(user: User): UserProfileDto {
    const profileImageUrl = this.getProfileImageUrl(user);

    return plainToInstance(
      UserProfileDto,
      {
        userId: user.id,
        name: user.name,
        username: user.username,
        profileImageUrl: profileImageUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  // 사용자 찾기
  private async getUserOrThrow(userId: number): Promise<User> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
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

  private getRandomDefaultImageKey(): string {
    const randomIndex = Math.floor(
      Math.random() * this.defaultImageKeys.length,
    );
    return this.defaultImageKeys[randomIndex];
  }

  private getProfileImageUrl(user: User): string {
    const profileImgKey =
      user.profileImgPath ?? this.getRandomDefaultImageKey();
    return this.s3Service.getFileUrl(profileImgKey);
  }

  private async deletePreviousProfileImage(previousKey: string): Promise<void> {
    if (previousKey && !this.defaultImageKeys.includes(previousKey)) {
      await this.s3Service.deleteFile(previousKey).catch((deleteError) => {
        console.error(
          `기존 이미지 ${previousKey}를 삭제하는 중에 문제가 발생했습니다.`,
          deleteError,
        );
      });
    }
  }

  // 유저 생성 시 프로필 이미지 부여
  async createUser(userData: Prisma.UserCreateInput): Promise<User> {
    userData.profileImgPath = this.getRandomDefaultImageKey();
    return this.usersRepository.createUser(userData);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findByUsername(username);
  }

  async findUserById(id: number) {
    return this.usersRepository.findUserById(id);
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.getUserOrThrow(userId);
    return this.toUserProfileDto(user);
  }

  async updateProfileImage(
    userId: number,
    profileImageFile: Express.Multer.File,
  ): Promise<UserProfileDto> {
    const user = await this.getUserOrThrow(userId);
    const previousKey = user.profileImgPath;
    let newProfileImgKey: string | null = null;

    try {
      newProfileImgKey = await this.s3Service.uploadFile(
        profileImageFile,
        S3ObjectType.PROFILE,
      );

      const updatedUser = await this.usersRepository.updateUser(userId, {
        profileImgPath: newProfileImgKey,
      });

      if (previousKey) {
        await this.deletePreviousProfileImage(previousKey);
      }

      return this.toUserProfileDto(updatedUser);
    } catch (error) {
      // 예외 발생 시, 업로드된 새 이미지 롤백(삭제)
      if (newProfileImgKey) {
        await this.s3Service
          .deleteFile(newProfileImgKey)
          .catch((deleteError) => {
            console.error('새 이미지 롤백 실패:', deleteError);
          });
      }
      throw error;
    }
  }

  async resetProfileImage(userId: number): Promise<UserProfileDto> {
    const user = await this.getUserOrThrow(userId);
    const previousKey = user.profileImgPath;

    if (previousKey && this.defaultImageKeys.includes(previousKey)) {
      return this.toUserProfileDto(user);
    }

    const defaultImageKey = this.getRandomDefaultImageKey();

    const updatedUser = await this.usersRepository.updateUser(userId, {
      profileImgPath: defaultImageKey,
    });

    if (previousKey) {
      await this.deletePreviousProfileImage(previousKey);
    }

    return this.toUserProfileDto(updatedUser);
  }

  async findMyGroups(
    userId: number,
    status?: MembershipStatus,
  ): Promise<UserGroupSummaryDto[]> {
    try {
      const memberships = await this.usersRepository.findGroupsByUserWithStatus(
        userId,
        status,
      );
      return memberships.map((m) => {
        let groupImgUrl: string | null = null;
        if (m.group.groupImgPath) {
          try {
            groupImgUrl = this.s3Service.getFileUrl(m.group.groupImgPath);
          } catch {
            groupImgUrl = null;
          }
        }

        return {
          groupId: m.group.id,
          groupName: m.group.name,
          groupImgUrl,
          role: m.role,
          status: m.status,
          joinedAt: m.createdAt,
        };
      });
    } catch {
      throw new InternalServerErrorException(
        '내 그룹 목록 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
