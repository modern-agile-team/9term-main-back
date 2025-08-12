import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  type ObjectIdentifier,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3ObjectType, type UploadContext } from './s3.types';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  private readonly folderMap: Record<S3ObjectType, string> = {
    [S3ObjectType.PROFILE]: 'profile/',
    [S3ObjectType.GROUP]: 'group/',
    [S3ObjectType.POST]: 'post/',
  };

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const accessKeyId =
      this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.region = region;
    this.bucket = bucket;

    const s3Config: S3ClientConfig = {
      region,
      credentials: { accessKeyId, secretAccessKey },
    };
    this.s3 = new S3Client(s3Config);
  }

  private isUploadContext(
    arg: UploadContext | S3ObjectType,
  ): arg is UploadContext {
    return typeof arg === 'object' && arg !== null && 'type' in arg;
  }

  private buildKey(ctx: UploadContext, originalName: string): string {
    const ext = extname(originalName);
    const id = uuidv4();
    switch (ctx.type) {
      case S3ObjectType.GROUP:
        return `group/${ctx.groupId}/${id}${ext}`;
      case S3ObjectType.POST:
        return ctx.postId
          ? `post/${ctx.groupId}/${ctx.postId}/${id}${ext}`
          : `post/${ctx.groupId}/${id}${ext}`;
      case S3ObjectType.PROFILE:
        return `profile/${ctx.userId}/${id}${ext}`;
      default:
        throw new InternalServerErrorException(
          '지원하지 않는 업로드 컨텍스트입니다.',
        );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    arg2: UploadContext | S3ObjectType,
  ): Promise<string> {
    if (this.isUploadContext(arg2)) {
      const key = this.buildKey(arg2, file.originalname);
      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      try {
        await this.s3.send(new PutObjectCommand(params));
        return key;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new InternalServerErrorException(`S3 업로드 실패: ${msg}`);
      }
    }

    const folder = this.folderMap[arg2];
    if (!folder) {
      throw new InternalServerErrorException(
        `S3 폴더 경로를 찾을 수 없습니다: ${String(arg2)}`,
      );
    }
    const legacyKey = `${folder}${uuidv4()}${extname(file.originalname)}`;
    const legacyParams: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: legacyKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    try {
      await this.s3.send(new PutObjectCommand(legacyParams));
      return legacyKey;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`S3 업로드 실패: ${msg}`);
    }
  }

  getFileUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const params: DeleteObjectCommandInput = { Bucket: this.bucket, Key: key };
    try {
      await this.s3.send(new DeleteObjectCommand(params));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`S3 삭제 실패: ${msg}`);
    }
  }

  async deleteFilesInBatches(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }
    const chunkSize = 1000;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk: ObjectIdentifier[] = keys
        .slice(i, i + chunkSize)
        .map((k): ObjectIdentifier => ({ Key: k }));
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: chunk, Quiet: true },
        }),
      );
    }
  }

  private async deleteAllByPrefix(prefix: string): Promise<void> {
    let token: string | undefined = undefined;

    do {
      const listed: ListObjectsV2CommandOutput = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );

      const contents = listed.Contents ?? [];
      const keys: string[] = contents
        .map((o) => o.Key)
        .filter((k): k is string => typeof k === 'string');

      if (keys.length > 0) {
        const objects: ObjectIdentifier[] = keys.map(
          (k): ObjectIdentifier => ({ Key: k }),
        );
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objects, Quiet: true },
          }),
        );
      }

      token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (token);
  }

  async deleteAllByPrefixes(prefixes: string[]): Promise<void> {
    for (const p of prefixes) {
      await this.deleteAllByPrefix(p);
    }
  }
}
