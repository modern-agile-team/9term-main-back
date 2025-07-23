// 생략된 import들은 그대로 유지
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUserResponse } from 'src/auth/interfaces/authenticated-user-response.interface';
import { ApiPosts } from './post.swagger';
import { PostsService } from './posts.service';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';
import { PostWriteResponseDto } from './dto/responses/post-write-response.dto';
import { PostResponseDto } from './dto/responses/post-response.dto';
import { ApiResponseDto } from 'src/groups/dto/api-response.dto';
import { plainToInstance } from 'class-transformer';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserResponse;
}

@ApiBearerAuth('access-token')
@Controller('groups/:groupId/posts')
@UseGuards(CustomJwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('postImage'))
  @ApiConsumes('multipart/form-data')
  @ApiPosts.create()
  async createPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() createPostDto: CreatePostRequestDto,
    @UploadedFile() uploadedFile: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<PostWriteResponseDto>> {
    const userId = req.user.userId;

    const createdPost = await this.postsService.createPost(
      createPostDto,
      groupId,
      userId,
      uploadedFile,
    );

    const response = plainToInstance(PostWriteResponseDto, createdPost, {
      excludeExtraneousValues: true,
    });

    return {
      status: 'success',
      message: '게시물이 성공적으로 생성되었습니다.',
      data: response,
    };
  }

  @Get()
  @ApiPosts.getAll()
  async getAllPosts(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<ApiResponseDto<PostResponseDto[]>> {
    const posts = await this.postsService.findAllPostsByGroupId(groupId);

    const postResponse = plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return {
      status: 'success',
      message: '게시물 목록을 성공적으로 가져왔습니다.',
      data: postResponse,
    };
  }

  @Get(':postId')
  @ApiPosts.getOne()
  async getPostById(
    @Param('postId', ParseIntPipe) postId: number,
  ): Promise<ApiResponseDto<PostResponseDto>> {
    const post = await this.postsService.getPostById(postId);

    const postResponse = plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });

    return {
      status: 'success',
      message: '게시물을 성공적으로 가져왔습니다.',
      data: postResponse,
    };
  }

  @Patch(':postId')
  @ApiConsumes('application/json')
  @ApiPosts.update()
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<PostWriteResponseDto>> {
    const userId = req.user.userId;

    const updatedPost = await this.postsService.updatePost(
      updatePostDto,
      postId,
      userId,
    );

    const response = plainToInstance(PostWriteResponseDto, updatedPost, {
      excludeExtraneousValues: true,
    });

    return {
      status: 'success',
      message: '게시물이 성공적으로 수정되었습니다.',
      data: response,
    };
  }

  @Delete(':postId')
  @ApiPosts.delete()
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user.userId;
    await this.postsService.deletePost(postId, userId);
    return {
      status: 'success',
      message: '게시물이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}
