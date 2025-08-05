import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';
import {
  CreatePostData,
  UpdatePostData,
  Post,
  PostWithCommentCount,
} from './interfaces/post.interface';
import { PostsRepository } from './posts.repository';
import { S3ObjectType } from 'src/s3/s3.types';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createPost(
    createPostDto: CreatePostRequestDto,
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<Post> {
    let postImagePath: string | undefined;

    try {
      if (fileToUpload) {
        postImagePath = await this.s3Service.uploadFile(
          fileToUpload,
          S3ObjectType.POST,
        );
      }

      const createPostData: CreatePostData = {
        title: createPostDto.title,
        content: createPostDto.content,
        groupId,
        userId,
      };

      return await this.postsRepository.createPostWithImage(
        createPostData,
        postImagePath,
      );
    } catch (err) {
      if (postImagePath) {
        await this.s3Service.deleteFile(postImagePath);
      }
      throw err;
    }
  }

  async findAllPostsByGroupId(
    groupId: number,
  ): Promise<PostWithCommentCount[]> {
    const posts =
      await this.postsRepository.findPostsWithCommentsCount(groupId);

    return posts.map((post) => {
      const imagePath = post.postImages?.[0]?.postImgPath;
      const postImageUrl = imagePath
        ? this.s3Service.getFileUrl(imagePath)
        : null;

      return {
        ...post,
        commentsCount: post._count.comments,
        postImageUrl,
      };
    });
  }

  async getPostById(id: number): Promise<PostWithCommentCount> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }

    const imagePath = post.postImages?.[0]?.postImgPath;
    const postImageUrl = imagePath
      ? this.s3Service.getFileUrl(imagePath)
      : null;

    return {
      ...post,
      commentsCount: post._count.comments,
      postImageUrl,
    };
  }

  async updatePost(
    updatePostDto: UpdatePostRequestDto,
    id: number,
    userId: number,
  ): Promise<Post> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 수정할 권한이 없습니다.');
    }

    const updateData: UpdatePostData = {
      title: updatePostDto.title,
      content: updatePostDto.content,
    };

    return await this.postsRepository.updatePost(id, updateData);
  }

  async deletePost(id: number, userId: number): Promise<void> {
    const post = await this.postsRepository.findPostById(id);
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시물을 찾을 수 없습니다.`);
    }
    if (post.userId !== userId) {
      throw new ForbiddenException('이 게시물을 삭제할 권한이 없습니다.');
    }

    if (post.postImages?.[0]) {
      await this.s3Service.deleteFile(post.postImages[0].postImgPath);
    }

    await this.postsRepository.deletePost(id);
  }
}
