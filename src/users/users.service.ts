import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { S3Service } from 'src/s3/s3.service';
import { UserProfileDto } from 'src/users/dto/responses/user-profile.dto';
import { CreateUserInput, IUsersService } from './interfaces/users.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {}

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
    const defaultImagesString = this.configService.get<string>(
      'DEFAULT_PROFILE_IMAGE_URL',
    );
    if (!defaultImagesString) {
      throw new InternalServerErrorException(
        '기본 프로필 이미지 URL 설정 오류',
      );
    }
    return defaultImagesString.split(',');
  }

  // 기본 이미지 중 랜덤으로 하나 선택
  private getRandomDefaultImageKey(): string {
    const defaultKeys = this.getDefaultImageKeys();
    const randomIndex = Math.floor(Math.random() * defaultKeys.length);
    return defaultKeys[randomIndex];
  }

  // 프로필 이미지 키를 가져오고 URL로 변환
  private getProfileImageUrl(user: User): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const profileImgKey =
      user.profileImgPath ?? this.getRandomDefaultImageKey();
    return this.s3Service.getFileUrl(profileImgKey);
  }

  // 유저 생성 시 프로필 이미지 부여
  async createUser(userData: CreateUserInput): Promise<User> {
    userData.profileImgPath = this.getRandomDefaultImageKey();
    return this.usersRepository.createUser(userData);
  }

  async findUserByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
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
}
