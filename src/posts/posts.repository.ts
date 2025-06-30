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
    return await this.prisma.post.create({
      data,
    });
  }

  async findPostsByGroupId(groupId: number) {
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
      },
    });
  }

  async findPostById(id: number) {
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
  async updatePostById(id: number, data: { title?: string; content?: string }) {
    return await this.prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        updatedAt: new Date(),
      },
    });
  }

  async deletePostById(id: number) {
    return await this.prisma.post.delete({
      where: { id },
    });
  }
}
