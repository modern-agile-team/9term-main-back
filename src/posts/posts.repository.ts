import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePostData,
  UpdatePostData,
  PostWithUserAndCount,
} from './interfaces/post.interface';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPostWithImage(
    data: CreatePostData,
    postImageKey?: string,
  ): Promise<Post> {
    return await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdPost = await tx.post.create({ data });

        if (postImageKey) {
          await tx.postImage.create({
            data: {
              postId: createdPost.id,
              postImgUrl: postImageKey,
            },
          });
        }

        return createdPost;
      },
    );
  }

  async updatePost(id: number, data: UpdatePostData): Promise<Post> {
    return await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deletePostWithImage(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.postImage.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });
    });
  }

  async findPostsWithCommentsCount(
    groupId: number,
  ): Promise<PostWithUserAndCount[]> {
    return await this.prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        postImages: true,
      },
    });
  }

  async findPostById(id: number): Promise<PostWithUserAndCount | null> {
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        postImages: true,
      },
    });
  }
}
