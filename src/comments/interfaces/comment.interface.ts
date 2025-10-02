import { Comment } from '@prisma/client';

export interface CommentAuthor {
  id: number;
  name: string;
}

export interface CommentWithAuthor extends Comment {
  user: CommentAuthor;
}

export interface CommentCreateData {
  content: string;
  userId: number;
  postId: number;
  parentId: number | null;
}
