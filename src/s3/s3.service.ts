import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3ObjectType } from './s3.types';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  private readonly folderMap: Record<S3ObjectType, string> = {
    [S3ObjectType.PROFILE]: 'profile/user_uploads/',
    [S3ObjectType.GROUP]: 'group/',
    [S3ObjectType.POST]: 'post/',
  };

  constructor(private readonly configService: ConfigService) {
    const region: string = this.configService.getOrThrow<string>('AWS_REGION');
    const bucket: string =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const accessKeyId: string =
      this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey: string = this.configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.region = region;
    this.bucket = bucket;

    const s3Config: S3ClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    this.s3 = new S3Client(s3Config);
  }

  async uploadFile(
    file: Express.Multer.File,
    type: S3ObjectType,
  ): Promise<string> {
    const folder = this.folderMap[type];
    if (!folder) {
      throw new InternalServerErrorException(
        `S3 폴더 경로를 찾을 수 없습니다: ${type}`,
      );
    }

    const key = `${folder}${uuidv4()}${extname(file.originalname)}`;
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read',
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      return key;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`S3 업로드 실패: ${err.message}`);
      throw new InternalServerErrorException(`S3 업로드 실패: ${err.message}`);
    }
  }

  getFileUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const params: DeleteObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await this.s3.send(command);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`S3 삭제 실패: ${err.message}`);
      throw new InternalServerErrorException(`S3 삭제 실패: ${err.message}`);
    }
  }
}
