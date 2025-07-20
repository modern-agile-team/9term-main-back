import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from 'src/comments/comments.repository';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';
import {
  CreatePostData,
  Post,
  PostWithCommentCount,
  UpdatePostData,
} from './interfaces/post.interface';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async createPost(
    createPostDto: CreatePostRequestDto,
    groupId: number,
    userId: number,
  ): Promise<Post> {
    const createPostData: CreatePostData = {
      title: createPostDto.title,
      content: createPostDto.content,
      groupId,
      userId,
    };

    const createdPost: Post =
      await this.postsRepository.createPost(createPostData);

    return createdPost;
  }

  async findAllPostsByGroupId(
    groupId: number,
  ): Promise<PostWithCommentCount[]> {
    const posts =
      await this.postsRepository.findPostsWithCommentsCount(groupId);

    const postsWithCommentsCount: PostWithCommentCount[] = posts.map(
      (post) => ({
        ...post,
        commentsCount: post._count.comments,
      }),
    );

    return postsWithCommentsCount;
  }

  async getPostById(id: number): Promise<PostWithCommentCount> {
    const post = await this.postsRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }

    const postsWithCommentsCount: PostWithCommentCount = {
      ...post,
      commentsCount: post._count.comments,
    };

    return postsWithCommentsCount;
  }

  async updatePost(
    updatePostDto: UpdatePostRequestDto,
    id: number,
    userId: number,
  ): Promise<Post> {
    const updatePostData: UpdatePostData = {
      title: updatePostDto.title,
      content: updatePostDto.content,
    };

    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');
    }
    const updatedPost = await this.postsRepository.updatePostById(
      id,
      updatePostData,
    );

    return updatedPost;
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.deletePostById(id);
  }
}
