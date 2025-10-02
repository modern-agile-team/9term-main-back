import { Comment } from '@prisma/client';
import { CreateCommentDto } from '../dto/requests/create-comment.dto';
import { UpdateCommentDto } from '../dto/requests/update-comment.dto';
import { CommentWithAuthor } from './comment.interface';

export interface ICommentsService {
  createComment(
    createCommentDto: CreateCommentDto,
    userId: number,
    postId: number,
    groupId: number,
  ): Promise<Comment>;

  getCommentsByPost(
    postId: number,
    groupId: number,
    parentId?: number,
  ): Promise<CommentWithAuthor[]>;

  updateComment(
    id: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
    groupId: number,
    postId: number,
  ): Promise<Comment>;

  deleteComment(
    id: number,
    userId: number,
    groupId: number,
    postId: number,
  ): Promise<void>;
}
