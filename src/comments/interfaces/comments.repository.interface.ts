import { Comment } from '@prisma/client';
import { CommentCreateData, CommentWithAuthor } from './comment.interface';

export interface ICommentsRepository {
  findCommentById(id: number): Promise<Comment | null>;

  createComment(data: CommentCreateData): Promise<Comment>;

  findComments(
    postId: number,
    parentId?: number | null,
  ): Promise<CommentWithAuthor[]>;

  updateComment(id: number, content: string): Promise<Comment>;

  deleteComment(id: number): Promise<Comment>;
}
