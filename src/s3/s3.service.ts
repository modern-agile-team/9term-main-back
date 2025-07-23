import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

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

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}${uuidv4()}${extname(file.originalname)}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(params);
      await this.s3.send(command);
      return key;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`S3 업로드 실패: ${error.message}`);
        throw new InternalServerErrorException(
          `S3 업로드 실패: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('S3 업로드 실패: 알 수 없는 에러');
    }
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
      if (error instanceof Error) {
        this.logger.error(`S3 삭제 실패: ${error.message}`);
        throw new InternalServerErrorException(
          `S3 삭제 실패: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('S3 삭제 실패: 알 수 없는 에러');
    }
  }

  async getPresignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const signedUrl: string = await getSignedUrl(this.s3, command, {
        expiresIn: 60 * 5,
      });

      return signedUrl;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Presigned URL 발급 실패: ${error.message}`);
        throw new InternalServerErrorException(
          `Presigned URL 발급 실패: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        'Presigned URL 발급 실패: 알 수 없는 에러',
      );
    }
  }
}
