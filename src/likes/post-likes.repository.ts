import { Injectable } from '@nestjs/common';
import { PostLike, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PostLikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: TxClient) {
    return tx ?? this.prisma;
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

  // 해당 유저가 좋아요 누른 게시물 ID 목록 조회
  async findLikedPostIdsByUser(
    userId: number,
    postIds: number[],
  ): Promise<number[]> {
    const likes = await this.prisma.postLike.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    return likes.map((like) => like.postId);
  }
}
