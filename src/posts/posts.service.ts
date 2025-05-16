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
    const createdPost = await this.postsRepository.createPost(createPostData);
    return {
      status: 'success',
      message: '게시글 작성 성공',
      data: createdPost,
    };
  }

  async getAllPosts(groupId: number) {
    const posts = await this.postsRepository.findPostsByGroupId(groupId);
    return {
      status: 'success',
      message: posts.length
        ? '게시글 목록 조회 성공'
        : '아직 게시글이 없습니다.',
      data: posts,
    };
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    return {
      status: 'success',
      message: '게시글 조회 성공',
      data: post,
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
    const updatedPost = await this.postsRepository.updatePostById(
      id,
      updatedPostData,
    );

    return {
      status: 'success',
      message: '게시물 수정 성공',
      data: updatedPost,
    };
  }

  async deletePost(id: number, userId: number) {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }
    const deletedPost = await this.postsRepository.deletePostById(id);
    return {
      status: 'success',
      message: '삭제 성공',
      data: deletedPost,
    };
  }
}
