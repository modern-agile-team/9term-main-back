import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { S3Service } from 'src/s3/s3.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserDeletionListener {
  private readonly logger = new Logger(UserDeletionListener.name);
  private readonly defaultImageKeys: string[];

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    const defaultImagesString = this.configService.get<string>(
      'DEFAULT_PROFILE_IMAGE_URL',
    );
    if (!defaultImagesString) {
      throw new Error('기본 프로필 이미지 URL 설정 오류');
    }
    this.defaultImageKeys = defaultImagesString.split(',');
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(event: {
    userId: number;
    previousProfileImgKey?: string;
  }) {
    // S3 이미지 삭제 (비동기 처리)
    if (
      event.previousProfileImgKey &&
      !this.defaultImageKeys.includes(event.previousProfileImgKey)
    ) {
      await this.s3Service
        .deleteFile(event.previousProfileImgKey)
        .catch((err) =>
          this.logger.error(
            `사용자(${event.userId}) 탈퇴 시 프로필 이미지 삭제 실패: ${event.previousProfileImgKey}`,
            err.stack,
            `${UserDeletionListener.name}#handleUserDeleted`,
          ),
        );
    }
  }
}
