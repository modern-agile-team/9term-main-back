import { PostCategory } from '@prisma/client';

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  groupId: number;
  createdAt: Date;
  updatedAt: Date | null;
  category: PostCategory;
}

export interface PostWithUser extends Post {
  user: {
    id: number;
    name: string;
  };
}

export interface PostImage {
  id: number;
  postId: number;
  postImgPath: string;
  createdAt: Date;
}

export interface PostWithUserAndCount extends PostWithUser {
  _count: {
    comments: number;
  };
  postImages: PostImage[];
}

export interface PostWithCommentCount extends PostWithUser {
  commentsCount: number;
  postImageUrl?: string | null;
}

export interface CreatePostData {
  title: string;
  content: string;
  groupId: number;
  userId: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}
