import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CustomJwtAuthGuard } from 'src/auth/guards/custom-jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';


@UseGuards(CustomJwtAuthGuard)
@Controller('groups/:groupId/posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async createComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const created = await this.commentsService.createComment(createCommentDto, userId, postId, groupId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 생성되었습니다.',
      data: created,
    };
  }

  @Get()
  async getCommentsByPost(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Query('parentId', new ParseIntPipe({ optional: true })) parentId?: number,
  ) {
    const comments = await this.commentsService.getCommentsByPost(postId, groupId, parentId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 조회되었습니다.',
      data: comments,
    };
  }

  @Patch(':id')
  async updateComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const updated = await this.commentsService.updateComment(id, updateCommentDto, userId, groupId, postId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 수정되었습니다.',
      data: updated,
    };
  }

  @Delete(':id')
  async deleteComment(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const deleted = await this.commentsService.deleteComment(id, userId, groupId, postId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 삭제되었습니다.',
      data: deleted,
    };
  }
}
