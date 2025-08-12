import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';

import { PostsRepository } from './posts.repository';
import { PostLikesRepository } from 'src/likes/post-likes.repository';

import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';

import { CreatePostData, Post, PostSummary } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly s3Service: S3Service,
    private readonly postLikesRepository: PostLikesRepository,
  ) {}

  async createPost(
    dto: CreatePostRequestDto,
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<Post> {
    let uploadedKey: string | undefined;

    try {
      if (fileToUpload) {
        uploadedKey = await this.s3Service.uploadFile(fileToUpload, {
          type: S3ObjectType.POST,
          groupId,
        });
      }

      const data: CreatePostData = {
        title: dto.title,
        content: dto.content,
        groupId,
        userId,
      };

      return await this.postsRepository.createPostWithImage(data, uploadedKey);
    } catch (error: unknown) {
      if (uploadedKey) {
        await this.s3Service.deleteFile(uploadedKey).catch(() => undefined);
      }
      throw error;
    }
  }

  async findAllPostsByGroupId(
    groupId: number,
    userId: number,
  ): Promise<PostSummary[]> {
    const posts =
      await this.postsRepository.findPostsWithCommentsCount(groupId);
    const postIds = posts.map((p) => p.id);
    const liked = new Set(
      await this.postLikesRepository.findLikedPostIdsByUser(userId, postIds),
    );

    return posts.map((p) => {
      const firstImgKey = p.postImages?.[0]?.postImgPath;
      const postImageUrl = firstImgKey
        ? this.s3Service.getFileUrl(firstImgKey)
        : null;

      return {
        id: p.id,
        groupId: p.groupId,
        userId: p.userId,
        user: { id: p.user.id, name: p.user.name },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        category: p.category,

        title: p.title,
        content: p.content,
        postImageUrl,

        commentsCount: p._count.comments,
        likesCount: p._count.postLikes,

        isLiked: liked.has(p.id),
      };
    });
  }

  async updatePost(
    dto: UpdatePostRequestDto,
    id: number,
    userId: number,
  ): Promise<Post> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');
    }

    return this.postsRepository.updatePost(id, {
      title: dto.title,
      content: dto.content,
    });
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    const keys = (post.postImages ?? [])
      .map((pi) => pi.postImgPath)
      .filter((k): k is string => typeof k === 'string' && k.length > 0);

    if (keys.length > 0) {
      await this.s3Service.deleteFilesInBatches(keys).catch(() => undefined);
    }

    await this.postsRepository.deletePost(id);
  }
}
