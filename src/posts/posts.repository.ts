import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePostData,
  PostWithUserAndCount,
  UpdatePostData,
} from './interfaces/post.interface';
import { Post } from '@prisma/client';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(data: CreatePostData): Promise<Post> {
    return await this.prisma.post.create({ data });
  }

  async findPostsWithCommentsCount(
    groupId: number,
  ): Promise<PostWithUserAndCount[]> {
    return await this.prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            comments: true,
          },
        },
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
      },
    });
  }

  async updatePostById(id: number, data: UpdatePostData) {
    return await this.prisma.post.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deletePostById(id: number): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
  }
}
