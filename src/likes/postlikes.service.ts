import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ToggleLikeResult } from './interfaces/postlikes.interface';
import { PostLikesRepository } from './postlikes.repository';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class PostLikesService {
  constructor(
    private readonly postLikesRepository: PostLikesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async toggleLike(
    groupId: number,
    postId: number,
    userId: number,
  ): Promise<ApiResponseDto<ToggleLikeResult>> {
    return this.prisma.$transaction(async (tx: PrismaTransactionClient) => {
      await this.postLikesRepository.findGroupByIdOrThrow(groupId, tx);
      const post = await this.postLikesRepository.findPostByIdOrThrow(
        postId,
        tx,
      );

      if (post.groupId !== groupId) {
        throw new NotFoundException(
          `ID가 ${postId}인 게시물은 ID가 ${groupId}인 그룹에 속한 게시물이 아닙니다.`,
        );
      }

      // 기존 좋아요 기록이 있는지 확인
      const existingLike = await this.postLikesRepository.findPostLike(
        userId,
        postId,
        tx,
      );

      let isLiked: boolean;

      if (existingLike) {
        // 좋아요 취소: 기록 삭제
        await this.postLikesRepository.deletePostLike(existingLike.id, tx);
        isLiked = false;
      } else {
        try {
          // 좋아요 추가: 새 기록 생성
          await this.postLikesRepository.createPostLike(userId, postId, tx);
          isLiked = true;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException('이미 좋아요를 누른 게시물입니다.');
          }
          throw error;
        }
      }
      return {
        status: 'success',
        data: { isLiked },
      };
    });
  }
}
