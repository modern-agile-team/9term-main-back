import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CommentsRepository } from 'src/comments/comments.repository';
import {
  Post,
  PostWithCommentCount,
  CreatePostData,
  UpdatePostData,
} from './interfaces/post.interface';
import { PostResponseDto } from './dto/responses/post-response.dto';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { PostCreateResponseDto } from './dto/responses/post-create-response.dto';
import { plainToInstance } from 'class-transformer';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';

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
  ): Promise<PostCreateResponseDto> {
    const createPostData: CreatePostData = {
      title: createPostDto.title,
      content: createPostDto.content,
      groupId,
      userId,
    };

    const createPost: Post =
      await this.postsRepository.createPost(createPostData);

    return plainToInstance(PostCreateResponseDto, createPost, {
      excludeExtraneousValues: true,
    });
  }

  async findAllPostsByGroupId(groupId: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.findPostsByGroupId(groupId);

    const postsWithCount = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await this.commentsRepository.countByPostId(
          post.id,
        );

        return {
          ...post,
          commentsCount,
        };
      }),
    );

    return plainToInstance(PostResponseDto, postsWithCount, {
      excludeExtraneousValues: true,
    });
  }

  async getPostById(id: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findPostById(id);

    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }

    const commentsCount = await this.commentsRepository.countByPostId(post.id);

    const postWithCount: PostWithCommentCount = {
      ...post,
      commentsCount,
    };

    return plainToInstance(PostResponseDto, postWithCount, {
      excludeExtraneousValues: true,
    });
  }

  async updatePost(
    updatePostDto: UpdatePostRequestDto,
    id: number,
    userId: number,
  ): Promise<PostResponseDto> {
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

    return plainToInstance(PostResponseDto, updatedPost, {
      excludeExtraneousValues: true,
    });
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.deletePostWithComments(id);
  }
}
