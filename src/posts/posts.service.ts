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

  async createPost(data: CreatePostDto & { userId: number; groupId: number }) {
    return this.postsRepository.createPost(data);
  }

  async getAllPosts(groupId: number) {
    return this.postsRepository.findPostsByGroupId(groupId);
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post)
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    return post;
  }

  async updatePost(id: number, data: UpdatePostDto, userId: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post)
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    if (post.userId !== userId)
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');

    return this.postsRepository.updatePostById(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async deletePost(id: number, userId: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post)
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    if (post.userId !== userId)
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');

    return this.postsRepository.deletePostById(id);
  }
}
