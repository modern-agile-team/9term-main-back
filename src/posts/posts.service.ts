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
import { GroupsRepository } from 'src/groups/groups.repository';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly s3Service: S3Service,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly groupRepostirory: GroupsRepository,
  ) {}

  private toImageUrl(key?: string | null): string | null {
    return key ? this.s3Service.getFileUrl(key) : null;
  }

  async createPost(
    createPostDto: CreatePostRequestDto,
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<Post> {
    let uploadedImageKey: string | undefined;

    try {
      if (fileToUpload) {
        uploadedImageKey = await this.s3Service.uploadFile(fileToUpload, {
          type: S3ObjectType.POST,
          groupId,
        });
      }

      const createData: CreatePostData = {
        title: createPostDto.title,
        content: createPostDto.content,
        groupId,
        userId,
      };

      return this.postsRepository.createPostWithImage(
        createData,
        uploadedImageKey,
      );
    } catch (error) {
      if (uploadedImageKey) {
        await this.s3Service
          .deleteFile(uploadedImageKey)
          .catch(() => undefined);
      }
      throw error;
    }
  }

  async findAllPostsByGroupId(
    groupId: number,
    userId: number,
  ): Promise<PostSummary[]> {
    const groups = await this.groupRepostirory.findGroupById(groupId);
    if (!groups) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }
    const postsWithCounts =
      await this.postsRepository.findPostsWithCommentsCount(groupId);

    const postIds = postsWithCounts.map((post) => post.id);
    const likedPostIds = await this.postLikesRepository.findLikedPostIdsByUser(
      userId,
      postIds,
    );
    const likedSet = new Set(likedPostIds);

    return postsWithCounts.map((post) => {
      const firstImageKey = post.postImages?.[0]?.postImgPath ?? null;

      return {
        id: post.id,
        groupId: post.groupId,
        userId: post.userId,
        user: {
          id: post.user.id,
          name: post.user.name,
          profileImageUrl: this.toImageUrl(post.user.profileImgPath) ?? null,
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        category: post.category,

        title: post.title,
        content: post.content,
        postImageUrl: this.toImageUrl(firstImageKey),

        commentsCount: post._count.comments,
        likesCount: post._count.postLikes,
        isLiked: likedSet.has(post.id),
      };
    });
  }

  async updatePost(
    updatePostDto: UpdatePostRequestDto,
    postId: number,
    userId: number,
  ): Promise<Post> {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundException(
        `ID가 ${postId}인 게시물을 찾을 수 없습니다.`,
      );
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');
    }

    return this.postsRepository.updatePost(postId, {
      title: updatePostDto.title,
      content: updatePostDto.content,
    });
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) {
      throw new NotFoundException(
        `ID가 ${postId}인 게시물을 찾을 수 없습니다.`,
      );
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    const imageKeys = (post.postImages ?? [])
      .map((img) => img.postImgPath)
      .filter(
        (key): key is string => typeof key === 'string' && key.length > 0,
      );

    if (imageKeys.length > 0) {
      await this.s3Service
        .deleteFilesInBatches(imageKeys)
        .catch(() => undefined);
    }

    await this.postsRepository.deletePost(postId);
  }
}
