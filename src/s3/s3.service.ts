import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type DeleteObjectCommandInput,
  type ListObjectsV2CommandOutput,
  type ObjectIdentifier,
  type PutObjectCommandInput,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3ObjectType, type UploadContext } from './s3.types';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly regionName: string;

  private readonly folderMap: Record<S3ObjectType, string> = {
    [S3ObjectType.PROFILE]: 'profile/user_uploads/',
    [S3ObjectType.GROUP]: 'group/',
    [S3ObjectType.GROUP_BANNER]: 'groupBanner/',
    [S3ObjectType.POST]: 'post/',
  };

  constructor(private readonly configService: ConfigService) {
    const regionName = this.configService.getOrThrow<string>('AWS_REGION');
    const bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const accessKeyId =
      this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.regionName = regionName;
    this.bucketName = bucketName;

    const s3Config: S3ClientConfig = {
      region: regionName,
      credentials: { accessKeyId, secretAccessKey },
    };
    this.s3Client = new S3Client(s3Config);
  }

  private isUploadContextType(
    target: UploadContext | S3ObjectType,
  ): target is UploadContext {
    return typeof target === 'object' && target !== null && 'type' in target;
  }

  private createObjectKey(
    uploadContext: UploadContext,
    originalFileName: string,
  ): string {
    const fileExtension = extname(originalFileName);
    const uniqueId = uuidv4();

    switch (uploadContext.type) {
      case S3ObjectType.GROUP:
        return `group/${uploadContext.groupId}/${uniqueId}${fileExtension}`;
      case S3ObjectType.POST:
        return uploadContext.postId
          ? `post/${uploadContext.groupId}/${uploadContext.postId}/${uniqueId}${fileExtension}`
          : `post/${uploadContext.groupId}/${uniqueId}${fileExtension}`;
      case S3ObjectType.PROFILE:
        return `profile/${uploadContext.userId}/${uniqueId}${fileExtension}`;
      case S3ObjectType.GROUP_BANNER:
        return `groupBanner/${uploadContext.groupId}/${uniqueId}${fileExtension}`;

      default:
        throw new InternalServerErrorException(
          '지원하지 않는 업로드 컨텍스트입니다.',
        );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadTarget: UploadContext | S3ObjectType,
  ): Promise<string> {
    if (this.isUploadContextType(uploadTarget)) {
      const objectKey = this.createObjectKey(uploadTarget, file.originalname);
      const putParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      try {
        await this.s3Client.send(new PutObjectCommand(putParams));
        return objectKey;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(
          `S3 업로드 실패: ${errorMessage}`,
        );
      }
    }

    const folderPrefix = this.folderMap[uploadTarget];
    if (!folderPrefix) {
      throw new InternalServerErrorException(
        `S3 폴더 경로를 찾을 수 없습니다: ${String(uploadTarget)}`,
      );
    }

    const legacyKey = `${folderPrefix}${uuidv4()}${extname(file.originalname)}`;
    const putParamsLegacy: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: legacyKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    try {
      await this.s3Client.send(new PutObjectCommand(putParamsLegacy));
      return legacyKey;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`S3 업로드 실패: ${errorMessage}`);
    }
  }

  getFileUrl(objectKey: string): string {
    return `https://${this.bucketName}.s3.${this.regionName}.amazonaws.com/${objectKey}`;
  }

  async deleteFile(objectKey: string): Promise<void> {
    const deleteParams: DeleteObjectCommandInput = {
      Bucket: this.bucketName,
      Key: objectKey,
    };
    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`S3 삭제 실패: ${errorMessage}`);
    }
  }

  async deleteFilesInBatches(objectKeys: string[]): Promise<void> {
    if (objectKeys.length === 0) {
      return;
    }

    const batchSize = 1000;
    for (let i = 0; i < objectKeys.length; i += batchSize) {
      const chunk: ObjectIdentifier[] = objectKeys
        .slice(i, i + batchSize)
        .map((key) => ({ Key: key }));

      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: chunk, Quiet: true },
        }),
      );
    }
  }

  private async deleteAllByPrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;

    do {
      const listedObjects: ListObjectsV2CommandOutput =
        await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

      const objectKeys = (listedObjects.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => typeof key === 'string');

      if (objectKeys.length > 0) {
        const deleteTargets: ObjectIdentifier[] = objectKeys.map((key) => ({
          Key: key,
        }));
        await this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: { Objects: deleteTargets, Quiet: true },
          }),
        );
      }

      continuationToken = listedObjects.IsTruncated
        ? listedObjects.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  async deleteAllByPrefixes(prefixes: string[]): Promise<void> {
    for (const prefix of prefixes) {
      await this.deleteAllByPrefix(prefix);
    }
  }
}
