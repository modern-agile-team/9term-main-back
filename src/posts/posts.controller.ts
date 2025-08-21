import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { User } from 'src/auth/user.decorator';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';
import { PostWriteResponseDto } from './dto/responses/post-write-response.dto';
import { PostResponseDto } from './dto/responses/post-response.dto';
import { ApiPosts } from './post.swagger';
import { PostsService } from './posts.service';

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
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<PostWriteResponseDto>> {
    const createdPost = await this.postsService.createPost(
      createPostDto,
      groupId,
      user.userId,
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
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<PostResponseDto[]>> {
    const posts = await this.postsService.findAllPostsByGroupId(
      groupId,
      user.userId,
    );

    const response = plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return {
      status: 'success',
      message: '게시물 목록을 성공적으로 가져왔습니다.',
      data: response,
    };
  }

  // @Get(':postId')
  // @ApiPosts.getOne()
  // async getPostById(
  //   @Param('postId', ParseIntPipe) postId: number,
  // ): Promise<ApiResponseDto<PostResponseDto>> {
  //   const post = await this.postsService.getPostById(postId);

  //   const response = plainToInstance(PostResponseDto, post, {
  //     excludeExtraneousValues: true,
  //   });

  //   return {
  //     status: 'success',
  //     message: '게시물을 성공적으로 가져왔습니다.',
  //     data: response,
  //   };
  // }

  @Patch(':postId')
  @ApiConsumes('application/json')
  @ApiPosts.update()
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostRequestDto,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<PostWriteResponseDto>> {
    const updatedPost = await this.postsService.updatePost(
      updatePostDto,
      postId,
      user.userId,
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
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<null>> {
    await this.postsService.deletePost(postId, user.userId);

    return {
      status: 'success',
      message: '게시물이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}
