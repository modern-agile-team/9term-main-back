export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  groupId: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PostWithUser extends Post {
  user: {
    id: number;
    name: string;
  };
}

export interface PostWithCommentCount extends PostWithUser {
  commentsCount: number;
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

export interface PostWithUserAndCount extends PostWithUser {
  _count: {
    comments: number;
  };
}
