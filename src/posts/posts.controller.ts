import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Request } from 'express';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';

@Controller('groups/:groupId/posts')
@UseGuards(CustomJwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const post = await this.postsService.createPost(
      createPostDto,
      groupId,
      userId,
    );
    return {
      status: 'success',
      message: '게시물이 성공적으로 생성되었습니다.',
      data: post,
    };
  }

  @Get()
  async getAllPosts(@Param('groupId', ParseIntPipe) groupId: number) {
    const posts = await this.postsService.getAllPosts(groupId);
    return {
      status: 'success',
      message: '게시물 목록을 성공적으로 가져왔습니다.',
      data: posts,
    };
  }

  @Get(':postId')
  async getPostById(@Param('postId', ParseIntPipe) postId: number) {
    const post = await this.postsService.getPostById(postId);
    return {
      status: 'success',
      message: '게시물을 성공적으로 가져왔습니다.',
      data: post,
    };
  }

  @Patch(':postId')
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const updatedPost = await this.postsService.updatePost(
      updatePostDto,
      postId,
      userId,
    );
    return {
      status: 'success',
      message: '게시물이 성공적으로 수정되었습니다.',
      data: updatedPost,
    };
  }

  @Delete(':postId')
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    await this.postsService.deletePost(postId, userId);
    return {
      status: 'success',
      message: '게시물이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}
