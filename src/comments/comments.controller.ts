import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUserResponse } from 'src/auth/interfaces/authenticated-user-response.interface';
import { User } from 'src/auth/user.decorator';
import { GroupMemberGuard } from 'src/member/guards/group-member.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { ApiComments } from './comment.swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/requests/create-comment.dto';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ResCommentDto } from './dto/responses/res-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@UseGuards(CustomJwtAuthGuard)
@Controller('groups/:groupId/posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(GroupMemberGuard)
  @Post()
  @ApiComments.create()
  async createComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<ResCommentDto>> {
    const created = await this.commentsService.createComment(
      createCommentDto,
      user.userId,
      postId,
      groupId,
    );
    return {
      status: 'success',
      message: '댓글이 성공적으로 생성되었습니다.',
      data: plainToInstance(ResCommentDto, created, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  @ApiComments.getList()
  async getCommentsByPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Query('parentId', new ParseIntPipe({ optional: true })) parentId?: number,
  ): Promise<ApiResponseDto<ResCommentDto[]>> {
    const comments = await this.commentsService.getCommentsByPost(
      postId,
      groupId,
      parentId,
    );
    return {
      status: 'success',
      message: '댓글이 성공적으로 조회되었습니다.',
      data: plainToInstance(ResCommentDto, comments, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @UseGuards(GroupMemberGuard)
  @Patch(':id')
  @ApiComments.update()
  async updateComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<ResCommentDto>> {
    const updated = await this.commentsService.updateComment(
      id,
      updateCommentDto,
      user.userId,
      groupId,
      postId,
    );
    return {
      status: 'success',
      message: '댓글이 성공적으로 수정되었습니다.',
      data: plainToInstance(ResCommentDto, updated, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @UseGuards(GroupMemberGuard)
  @Delete(':id')
  @ApiComments.delete()
  async deleteComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<null>> {
    await this.commentsService.deleteComment(id, user.userId, groupId, postId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }
}
