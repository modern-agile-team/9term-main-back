import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';
import { UserProfileDto } from 'src/users/dto/responses/user-profile.dto';
import { UserGroupSummaryDto } from 'src/users/dto/responses/user-group-summary.dto';
import { MembershipStatus } from '@prisma/client';
import { CreateUserInput, IUsersService } from './interfaces/users.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService implements IUsersService {
  private readonly defaultImageKey: string[];

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
    this.defaultImageKey = defaultImagesString.split(',');
  }

  // 사용자 찾기
  private async findUserOrThrow(userId: number): Promise<User> {
    const user = await this.usersRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // 기본 이미지 URL 목록 가져오기
  private getDefaultImageKeys(): string[] {
    return this.defaultImageKey;
  }

  // 기본 이미지 중 랜덤으로 하나 선택
  private getRandomDefaultImageKey(): string {
    const randomIndex = Math.floor(Math.random() * this.defaultImageKey.length);
    return this.defaultImageKey[randomIndex];
  }

  // 프로필 이미지 키를 가져오고 URL로 변환
  private getProfileImageUrl(user: User): string {
    const profileImgKey =
      user.profileImgPath ?? this.getRandomDefaultImageKey();
    return this.s3Service.getFileUrl(profileImgKey);
  }

  /**
   * @description S3에 있는 이전 프로필 이미지를 삭제합니다.
   * 기본 이미지일 경우 -> 삭제 x
   * 삭제 실패 시 에러를 throw하지 않고 로그만 남깁니다.
   *
   * @param previousKey 삭제할 이미지의 S3 키
   */
  private async deletePreviousProfileImage(previousKey: string): Promise<void> {
    const defaultKeys = this.getDefaultImageKeys();
    if (previousKey && !defaultKeys.includes(previousKey)) {
      await this.s3Service.deleteFile(previousKey).catch((deleteError) => {
        console.error(
          `기존 이미지 ${previousKey}를 삭제하는 중에 문제가 발생했습니다.`,
          deleteError,
        );
      });
    }
  }

  // 유저 생성 시 프로필 이미지 부여
  async createUser(userData: CreateUserInput): Promise<User> {
    userData.profileImgPath = this.getRandomDefaultImageKey();
    return this.usersRepository.createUser(userData);
  }

  async findUserByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
  }

  async findUserById(id: number) {
    return this.usersRepository.findUserById(id);
  }

  async findMyProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.findUserOrThrow(userId);
    const profileImgUrl = this.getProfileImageUrl(user);

    return plainToInstance(
      UserProfileDto,
      {
        userId: user.id,
        name: user.name,
        username: user.username,
        profileImgUrl: profileImgUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  async updateProfileImage(
    userId: number,
    profileImageFile: Express.Multer.File,
  ): Promise<UserProfileDto> {
    const user = await this.findUserOrThrow(userId);
    // 기존 S3 키를 변수에 저장
    const previousKey = user.profileImgPath;
    let newProfileImgKey: string | null = null;

    try {
      // 1. S3에 새 이미지 업로드
      newProfileImgKey = await this.s3Service.uploadFile(
        profileImageFile,
        S3ObjectType.PROFILE,
      );

      // 2. DB에 새 이미지 경로로 업데이트
      const updatedUser = await this.usersRepository.updateUser(userId, {
        profileImgPath: newProfileImgKey,
      });

      // 3. 이전 이미지가 있다면 S3에서 삭제 (성공했을 때만)
      if (previousKey) {
        await this.deletePreviousProfileImage(previousKey);
      }
      const profileImgUrl = this.getProfileImageUrl(updatedUser);

      return plainToInstance(
        UserProfileDto,
        {
          userId: updatedUser.id,
          name: updatedUser.name,
          username: updatedUser.username,
          profileImgUrl: profileImgUrl,
        },
        { excludeExtraneousValues: true },
      );
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

  async deleteProfileImage(userId: number): Promise<UserProfileDto> {
    const user = await this.findUserOrThrow(userId);
    const previousKey = user.profileImgPath;
    const defaultImageKey = this.getRandomDefaultImageKey();

    const updatedUser = await this.usersRepository.updateUser(userId, {
      profileImgPath: defaultImageKey,
    });

    if (previousKey) {
      await this.deletePreviousProfileImage(previousKey);
    }

    const profileImgUrl = this.getProfileImageUrl(updatedUser);

    return plainToInstance(
      UserProfileDto,
      {
        userId: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        profileImgUrl: profileImgUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findMyGroups(
    userId: number,
    status?: MembershipStatus,
  ): Promise<UserGroupSummaryDto[]> {
    try {
      const memberships = await this.usersRepository.findGroupsByUser(
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
