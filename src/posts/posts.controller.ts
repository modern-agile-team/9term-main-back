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
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('groups/:groupId/posts')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  createPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.createPost(createPostDto, groupId, userId);
  }

  @Get()
  getAllPosts(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.postsService.getAllPosts(groupId);
  }

  @Get(':postId')
  getPostById(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.postsService.getPostById(postId);
  }

  @Patch(':postId')
  updatePost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.updatePost(updatePostDto, postId, userId);
  }

  @Delete(':postId')
  deletePost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.deletePost(postId, userId);
  }
}
