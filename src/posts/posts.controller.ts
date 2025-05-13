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

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post(':groupId/posts')
  create(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.createPost({ ...createPostDto, groupId, userId });
  }

  @Get(':groupId/posts')
  findAll(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.postsService.getAllPosts(groupId);
  }

  @Get('posts/:postId')
  findOne(@Param('postId', ParseIntPipe) postId: number) {
    return this.postsService.getPostById(postId);
  }

  @Patch('posts/:postId')
  update(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.updatePost(postId, updatePostDto, userId);
  }

  @Delete('posts/:postId')
  remove(@Param('postId', ParseIntPipe) postId: number, @Req() req: Request) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    return this.postsService.deletePost(postId, userId);
  }
}
