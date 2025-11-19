import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Group, Post, Prisma } from '@prisma/client';
import { GroupsRepository } from 'src/groups/groups.repository';
import { PostsRepository } from 'src/posts/posts.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ToggleLikeResult } from './interfaces/postlikes.interface';
import { PostLikesRepository } from './post-likes.repository';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PostLikesService {
  constructor(
    private readonly postLikesRepository: PostLikesRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async _validatePostAndGroup(
    groupId: number,
    postId: number,
    tx: TxClient,
  ): Promise<{ group: Group; post: Post }> {
    const group = await this.groupsRepository.findGroupById(groupId, tx);
    if (!group) {
      throw new NotFoundException(`ID가 ${groupId}인 그룹을 찾을 수 없습니다.`);
    }

    const post = await this.postsRepository.findPostById(postId, tx);
    if (!post) {
      throw new NotFoundException(
        `ID가 ${postId}인 게시물을 찾을 수 없습니다.`,
      );
    }

    if (post.groupId !== groupId) {
      throw new NotFoundException(
        `ID가 ${postId}인 게시물은 ID가 ${groupId}인 그룹에 속한 게시물이 아닙니다.`,
      );
    }
    return { group, post };
  }

  async createLike(
    groupId: number,
    postId: number,
    userId: number,
  ): Promise<ApiResponseDto<ToggleLikeResult>> {
    return this.prisma.$transaction(async (tx: TxClient) => {
      await this._validatePostAndGroup(groupId, postId, tx);

      try {
        await this.postLikesRepository.createPostLike(userId, postId, tx);
        return {
          status: 'success',
          data: { isLiked: true },
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('이미 좋아요를 누른 게시물입니다.');
        }
        throw error;
      }
    });
  }

  async deleteLike(
    groupId: number,
    postId: number,
    userId: number,
  ): Promise<ApiResponseDto<ToggleLikeResult>> {
    return this.prisma.$transaction(async (tx: TxClient) => {
      await this._validatePostAndGroup(groupId, postId, tx);

      const existingLike = await this.postLikesRepository.findPostLike(
        userId,
        postId,
        tx,
      );

      if (!existingLike) {
        throw new NotFoundException(
          '해당 게시물에 좋아요를 누르지 않았습니다.',
        );
      }

      await this.postLikesRepository.deletePostLike(existingLike.id, tx);

      return {
        status: 'success',
        data: { isLiked: false },
      };
    });
  }
}
