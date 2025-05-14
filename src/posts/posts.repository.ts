// src/posts/posts.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(data: {
    userId: number;
    groupId: number;
    title: string;
    content: string;
  }) {
    return this.prisma.post.create({
      data,
    });
  }

  async findPostsByGroupId(groupId: number) {
    return this.prisma.post.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPostById(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async updatePostById(id: number, data: { title?: string; content?: string }) {
    return this.prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        updatedAt: new Date(),
      },
    });
  }

  async deletePostById(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
