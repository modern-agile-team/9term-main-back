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

export interface PostUserRaw {
  id: number;
  name: string;
  profileImgPath: string | null;
}

export interface PostUserView {
  id: number;
  name: string;
  profileImageUrl: string | null;
}

export interface PostWithUser extends Post {
  user: PostUserRaw;
}

export interface PostImageLite {
  postImgPath: string;
}

export interface PostWithUserAndCountRaw extends PostWithUser {
  _count: {
    comments: number;
    postLikes: number;
  };
  postImages: PostImageLite[];
}

export interface PostSummary extends Post {
  user: PostUserView;
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
  category: PostCategory;
  groupId: number;
  userId: number;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}
