import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('/posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/comments')
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const created = await this.commentsService.create(createCommentDto, userId, postId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 생성되었습니다.',
      data: created,
    };
  }

  @Get(':postId/comments')
  async getcommentsByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('parentId', new ParseIntPipe({ optional: true })) parentId?: number,
  ) {
    const comments = await this.commentsService.getCommentsByPost(postId, parentId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 조회되었습니다.',
      data: comments,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':postId/comments/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const updated = await this.commentsService.update(id, updateCommentDto, userId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 수정되었습니다.',
      data: updated,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId/comments/:id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number };
    const userId = user.userId;
    const deleted = await this.commentsService.delete(id, userId);
    return {
      status: 'success',
      message: '댓글이 성공적으로 삭제되었습니다.',
      data: deleted,
    };
  }
}
