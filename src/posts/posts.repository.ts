import { Injectable } from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePostData,
  PostWithUserAndCountRaw,
  UpdatePostData,
} from './interfaces/post.interface';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPostWithImage(
    data: CreatePostData,
    postImagePath?: string,
  ): Promise<Post> {
    return await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({ data });

      if (postImagePath) {
        await tx.postImage.create({
          data: {
            postId: createdPost.id,
            postImgPath: postImagePath,
          },
        });
      }

      return createdPost;
    });
  }

  async updatePost(
    id: number,
    data: UpdatePostData,
    tx?: TxClient,
  ): Promise<Post> {
    return await (tx ?? this.prisma).post.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deletePost(id: number, tx?: TxClient): Promise<void> {
    await (tx ?? this.prisma).post.delete({ where: { id } });
  }

  async findPostsWithCommentsCount(
    groupId: number,
  ): Promise<PostWithUserAndCountRaw[]> {
    return await this.prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImgPath: true,
          },
        },
        _count: {
          select: {
            comments: true,
            postLikes: true,
          },
        },
        postImages: {
          select: { postImgPath: true },
        },
      },
    });
  }

  async findPostById(
    id: number,
    tx?: TxClient,
  ): Promise<PostWithUserAndCountRaw | null> {
    return await (tx ?? this.prisma).post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImgPath: true,
          },
        },
        _count: {
          select: {
            comments: true,
            postLikes: true,
          },
        },
        postImages: {
          select: { postImgPath: true },
        },
      },
    });
  }
}
