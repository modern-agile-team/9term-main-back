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

export interface PostWithUserAndCountRaw extends PostWithUser {
  _count: {
    comments: number;
    postLikes: number;
  };
  postImages: PostImage[];
}

export interface PostSummary extends PostWithUser {
  commentsCount: number;
  likesCount: number;
  postImageUrl: string | null;
  isLiked: boolean;
}

export interface PostImage {
  id: number;
  postId: number;
  postImgPath: string;
  createdAt: Date;
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
