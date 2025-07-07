import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostData, PostWithUser } from './interfaces/post.interface';
import { Post } from '@prisma/client';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(data: CreatePostData): Promise<Post> {
    return await this.prisma.post.create({ data });
  }

  async findPostsByGroupId(groupId: number): Promise<PostWithUser[]> {
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
      },
    });
  }

  async findPostById(id: number): Promise<PostWithUser | null> {
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updatePostById(id: number, data: { title?: string; content?: string }) {
    return await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deletePostWithComments(postId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({
        where: { postId },
      });

      await tx.post.delete({
        where: { id: postId },
      });
    });
  }
}
