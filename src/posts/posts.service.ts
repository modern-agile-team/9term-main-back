import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';

import { PostLikesRepository } from 'src/likes/post-likes.repository';
import { PostsRepository } from './posts.repository';

import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';

import { PostCategory, UserGroupRole } from '@prisma/client';
import { GroupsRepository } from 'src/groups/groups.repository';
import { MemberRepository } from 'src/member/member.repository';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreatePostData, Post, PostSummary } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly s3Service: S3Service,
    private readonly postLikesRepository: PostLikesRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly memberRepository: MemberRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureManager(groupId: number, userId: number) {
    const member = await this.memberRepository.findGroupMember(groupId, userId);
    if (!member || member.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('공지 작성/변경은 메니저만 가능합니다');
    }
  }

  private toImageUrl(key?: string | null): string | null {
    return key ? this.s3Service.getFileUrl(key) : null;
  }

  async createPost(
    createPostDto: CreatePostRequestDto,
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<Post> {
    const category = createPostDto.category ?? PostCategory.NORMAL;
    if (createPostDto.category === PostCategory.ANNOUNCEMENT) {
      await this.ensureManager(groupId, userId);
    }

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
        category,
        groupId,
        userId,
      };

      const post = await this.postsRepository.createPostWithImage(
        createData,
        uploadedImageKey,
      );

      const memberIds =
        await this.memberRepository.findMemberIdsByGroup(groupId);
      const recipientIds = memberIds.filter((memberId) => memberId !== userId);
      // 게시물 생성 후 알림 추가
      try {
        await this.notificationsService.notifyByNewPost(post, recipientIds);
      } catch (error) {
        this.logger.warn(
          `새 게시물 알림 전송 실패: ${error.message}`,
          error.stack,
        );
      }

      return post;
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
    const groups = await this.groupsRepository.findGroupById(groupId);
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

    const needsManager =
      post.category === PostCategory.ANNOUNCEMENT ||
      updatePostDto.category === PostCategory.ANNOUNCEMENT;

    if (needsManager) {
      await this.ensureManager(post.groupId, userId);
    } else {
      if (post.userId !== userId) {
        throw new ForbiddenException('작성자만 수정할 수 있습니다.');
      }
    }

    return this.postsRepository.updatePost(postId, {
      title: updatePostDto.title,
      content: updatePostDto.content,
      category: updatePostDto.category,
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
