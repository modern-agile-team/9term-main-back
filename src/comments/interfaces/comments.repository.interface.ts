import { Comment } from '@prisma/client';

export interface ICommentsRepository {
  findCommentById(id: number): Promise<Comment | null>;

  createComment(data: {
    content: string;
    userId: number;
    postId: number;
    parentId: number | null;
  }): Promise<Comment>;

  findComments(
    postId: number,
    parentId?: number | null,
  ): Promise<(Comment & { user: { id: number; name: string } })[]>;

  updateComment(id: number, content: string): Promise<Comment>;

  deleteComment(id: number): Promise<Comment>;
}
