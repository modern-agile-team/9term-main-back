import { Injectable, NotFoundException } from '@nestjs/common';
import { Group, Post, PostLike, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PostLikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: TxClient) {
    return tx ?? this.prisma;
  }

  // 그룹 조회 메서드
  async findGroupByIdOrThrow(groupId: number, tx?: TxClient): Promise<Group> {
    const group = await this.getClient(tx).group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException(`ID가 ${groupId}인 그룹을 찾을 수 없습니다.`);
    }
    return group;
  }

  // 게시물 조회 메서드
  async findPostByIdOrThrow(postId: number, tx?: TxClient): Promise<Post> {
    const post = await this.getClient(tx).post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(
        `ID가 ${postId}인 게시물을 찾을 수 없습니다.`,
      );
    }
    return post;
  }

  // 좋아요 기록 조회 메서드
  async findPostLike(
    userId: number,
    postId: number,
    tx?: TxClient,
  ): Promise<PostLike | null> {
    return this.getClient(tx).postLike.findUnique({
      where: {
        postId_userId: {
          userId: userId,
          postId: postId,
        },
      },
    });
  }

  // 좋아요 기록 생성 메서드
  async createPostLike(
    userId: number,
    postId: number,
    tx: TxClient,
  ): Promise<PostLike> {
    return tx.postLike.create({
      data: { userId, postId },
    });
  }

  // 좋아요 기록 삭제 메서드
  async deletePostLike(postLikeId: number, tx: TxClient): Promise<void> {
    await tx.postLike.delete({
      where: { id: postLikeId },
    });
  }

  // 게시물 좋아요 개수 조회
  async getPostLikeCount(postId: number): Promise<number> {
    const count = await this.prisma.postLike.count({
      where: { postId: postId },
    });
    return count;
  }
}
