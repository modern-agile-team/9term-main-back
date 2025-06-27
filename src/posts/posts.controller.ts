import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUserResponse } from 'src/auth/interfaces/authenticated-user-response.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ApiPosts } from './post.swagger';
import { PostsService } from './posts.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserResponse;
}

@Controller('groups/:groupId/posts')
@UseGuards(CustomJwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiPosts.create()
  async createPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() dto: CreatePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const post = await this.postsService.createPost(dto, groupId, userId);
    return {
      status: 'success',
      message: '게시물이 성공적으로 생성되었습니다.',
      data: post,
    };
  }

  @Get()
  @ApiPosts.getAll()
  async getAllPosts(@Param('groupId', ParseIntPipe) groupId: number) {
    const posts = await this.postsService.getAllPosts(groupId);
    return {
      status: 'success',
      message: '게시물 목록을 성공적으로 가져왔습니다.',
      data: posts,
    };
  }

  @Get(':postId')
  @ApiPosts.getOne()
  async getPostById(@Param('postId', ParseIntPipe) postId: number) {
    const post = await this.postsService.getPostById(postId);
    return {
      status: 'success',
      message: '게시물을 성공적으로 가져왔습니다.',
      data: post,
    };
  }

  @Patch(':postId')
  @ApiPosts.update()
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: UpdatePostDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    const post = await this.postsService.updatePost(dto, postId, userId);
    return {
      status: 'success',
      message: '게시물이 성공적으로 수정되었습니다.',
      data: post,
    };
  }

  @Delete(':postId')
  @ApiPosts.delete()
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    await this.postsService.deletePost(postId, userId);
    return {
      status: 'success',
      message: '게시물이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}
