import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PostGroupInfo } from 'src/posts/interfaces/post.interface';
import { PostsRepository } from 'src/posts/posts.repository';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/requests/create-comment.dto';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { CommentWithAuthor } from './interfaces/comment.interface';
import { ICommentsService } from './interfaces/comments.service.interface';

@Injectable()
export class CommentsService implements ICommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  // 댓글 생성 (부모 댓글이 있을 경우 parentId 설정)
  async createComment(
    createCommentDto: CreateCommentDto,
    userId: number,
    postId: number,
    groupId: number,
  ): Promise<Comment> {
    const { content, parentId } = createCommentDto;

    await this.verifyPostAndGroup(postId, groupId);

    if (parentId) {
      const parentComment = await this.verifyParentComment(parentId, postId);

      if (parentComment.parentId !== null) {
        throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
      }
    }

    const newComment = await this.commentsRepository.createComment({
      content,
      userId,
      postId,
      parentId: parentId || null,
    });

    // parentId가 없거나 null이면 최상위 댓글로 저장됨.
    return newComment;
  }

  // 특정 게시물의 댓글 가져오기
  async getCommentsByPost(
    postId: number,
    groupId: number,
    parentId?: number,
  ): Promise<CommentWithAuthor[]> {
    await this.verifyPostAndGroup(postId, groupId);

    if (parentId) {
      await this.verifyParentComment(parentId, postId);
    }

    const comments = await this.commentsRepository.findComments(
      postId,
      parentId,
    );

    return comments;
  }

  // 댓글 수정
  async updateComment(
    id: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
    groupId: number,
    postId: number,
  ): Promise<Comment> {
    await this.verifyPostAndGroup(postId, groupId);
    const comment = await this.verifyCommentOwnership(id, userId, postId);
    const newContent = updateCommentDto.content;

    if (newContent === undefined || newContent === comment.content) {
      return comment;
    }

    const updatedComment = await this.commentsRepository.updateComment(
      id,
      newContent,
    );
    return updatedComment;
  }

  // 댓글 삭제
  async deleteComment(
    id: number,
    userId: number,
    groupId: number,
    postId: number,
  ): Promise<void> {
    await this.verifyPostAndGroup(postId, groupId);
    await this.verifyCommentOwnership(id, userId, postId);
    await this.commentsRepository.deleteComment(id);
  }

  // 검증용 메서드 ( 댓글, 게시물/그룹, 부모 댓글)
  private async verifyCommentOwnership(
    commentId: number,
    userId: number,
    postId: number,
  ): Promise<Comment> {
    const comment = await this.commentsRepository.findCommentById(commentId);

    if (!comment) {
      throw new NotFoundException('해당 댓글이 존재하지 않습니다.');
    }
    if (comment.postId !== postId) {
      throw new NotFoundException('해당 게시물에 속하지 않는 댓글입니다.');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        '해당 댓글을 수정하거나 삭제할 수 있는 권한이 없습니다.',
      );
    }
    return comment;
  }

  private async verifyPostAndGroup(
    postId: number,
    groupId: number,
  ): Promise<PostGroupInfo> {
    const post = await this.postsRepository.findGroupByPostId(postId);

    if (!post) {
      throw new NotFoundException('존재하지 않는 게시물입니다.');
    }
    if (post.groupId !== groupId) {
      throw new BadRequestException('해당 그룹에 속하지 않는 게시물입니다.');
    }
    return post;
  }

  private async verifyParentComment(
    parentId: number,
    postId: number,
  ): Promise<Comment> {
    const parentComment =
      await this.commentsRepository.findCommentById(parentId);

    if (!parentComment) {
      throw new NotFoundException('존재하지 않는 부모 댓글입니다.');
    }
    if (parentComment.postId !== postId) {
      throw new NotFoundException('해당 게시물에 속하지 않는 부모 댓글입니다.');
    }
    return parentComment;
  }
}
