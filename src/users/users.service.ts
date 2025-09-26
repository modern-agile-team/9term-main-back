import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipStatus, Prisma, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';
import { UserGroupSummaryDto } from 'src/users/dto/responses/user-group-summary.dto';
import { UserProfileDto } from 'src/users/dto/responses/user-profile.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly defaultImageKeys: string[];
  private readonly NAME_CHANGE_INTERVAL_DAYS = 30;

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

  private getNextAvailableDate(nameChangedAt: Date): Date {
    const next = new Date(nameChangedAt);
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + this.NAME_CHANGE_INTERVAL_DAYS);

    return next;
  }

  private validateNameChange(user: User, newName: string): string | null {
    const trimmedName = newName.trim();

    if (trimmedName.length === 0) {
      throw new BadRequestException('이름은 공백만으로 이루어질 수 없습니다.');
    }

    if (user.nameChangedAt) {
      const nextAvailable = this.getNextAvailableDate(user.nameChangedAt);
      if (new Date() < nextAvailable) {
        throw new BadRequestException(
          `이름은 최근 변경일로부터 ${this.NAME_CHANGE_INTERVAL_DAYS}일 이후에 다시 변경할 수 있습니다.`,
        );
      }
    }

    if (user.name.trim() === trimmedName) {
      return null;
    }

    return trimmedName;
  }

  private toUserProfileDto(
    user: User,
    includeNextAvailableDate = false,
  ): UserProfileDto {
    const profileImageUrl = this.getProfileImageUrl(user);

    const nextAvailableDate = user.nameChangedAt
      ? this.getNextAvailableDate(user.nameChangedAt).toISOString()
      : null;

    return plainToInstance<UserProfileDto, Record<string, unknown>>(
      UserProfileDto,
      {
        userId: user.id,
        name: user.name,
        username: user.username,
        profileImageUrl,
        ...(includeNextAvailableDate ? { nextAvailableDate } : {}),
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
    return this.toUserProfileDto(user, true);
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

  async updateProfileName(
    userId: number,
    name: string,
  ): Promise<UserProfileDto> {
    const user = await this.getUserOrThrow(userId);
    const trimmedName = this.validateNameChange(user, name);

    if (trimmedName === null) {
      return this.toUserProfileDto(user);
    }

    const updatedUser = await this.usersRepository.updateUser(userId, {
      name: trimmedName,
      nameChangedAt: new Date(),
    });

    return this.toUserProfileDto(updatedUser, true);
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
