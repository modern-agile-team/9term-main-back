import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCommentById(id: number) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  createComment(data: {
    content: string;
    userId: number;
    postId: number;
    parentId?: number | null;
  }) {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        userId: data.userId,
        postId: data.postId,
        parentId: data.parentId,
      },
    });
  }

  findComments(postId: number, parentId: number | null = null) {
    return this.prisma.comment.findMany({
      where: { postId, parentId },
      orderBy: { createdAt: 'asc' }, // 댓글 오름차순 정렬
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  updateComment(id: number, content: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });
  }

  deleteComment(id: number) {
    return this.prisma.comment.delete({ where: { id } });
  }
}
