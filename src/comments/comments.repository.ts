import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommentWithAuthor } from './interfaces/comment.interface';
import { ICommentsRepository } from './interfaces/comments.repository.interface';

@Injectable()
export class CommentsRepository implements ICommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCommentById(id: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  createComment(data: {
    content: string;
    userId: number;
    postId: number;
    parentId?: number | null;
  }): Promise<Comment> {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        userId: data.userId,
        postId: data.postId,
        parentId: data.parentId,
      },
    });
  }

  findComments(
    postId: number,
    parentId: number | null = null,
  ): Promise<CommentWithAuthor[]> {
    return this.prisma.comment.findMany({
      where: { postId, parentId },
      orderBy: { createdAt: 'asc' }, // 댓글 오름차순 정렬
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

  updateComment(id: number, content: string): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
      },
    });
  }

  deleteComment(id: number): Promise<Comment> {
    return this.prisma.comment.delete({ where: { id } });
  }
}
