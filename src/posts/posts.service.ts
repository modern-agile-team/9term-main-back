import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async createPost(
    createPostDto: CreatePostDto,
    groupId: number,
    userId: number,
  ) {
    const createPostData = {
      title: createPostDto.title,
      content: createPostDto.content,
      groupId,
      userId,
    };
    return await this.postsRepository.createPost(createPostData);
  }

  async getAllPosts(groupId: number) {
    const posts = await this.postsRepository.findPostsByGroupId(groupId);

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      commentsCount: post._count.comments, // 추가된 부분
    }));
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }

    return {
      id: post.id,
      userId: post.userId,
      groupId: post.groupId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      user: post.user,
      commentsCount: post._count.comments, // ✅ 댓글 수 포함
    };
  }

  async updatePost(updatePostDto: UpdatePostDto, id: number, userId: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');
    }
    const updatedPostData = {
      title: updatePostDto.title,
      content: updatePostDto.content,
    };

    return await this.postsRepository.updatePostById(id, updatedPostData);
  }

  async deletePost(id: number, userId: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    return await this.postsRepository.deletePostById(id);
  }
}
