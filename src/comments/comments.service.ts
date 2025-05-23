import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
    constructor(private readonly commentsRepo: CommentsRepository) {}

    // 댓글 생성 (부모 댓글이 있을 경우 parentId 설정)
    async create(createCommentDto: CreateCommentDto, userId: number, postId: number) {
        const { content, parentId } = createCommentDto;

        if (!content?.trim()) {
            throw new BadRequestException('댓글 내용은 필수입니다.');
        }

        if (parentId) {
            const parentComment = await this.commentsRepo.findCommentById(parentId);
            if (!parentComment) {
                throw new NotFoundException('존재하지 않는 부모 댓글입니다.');
            }
            if (parentComment.parentId !== null) {
                throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
            }
        }
    
        // parentId가 없거나 null이면 최상위 댓글로 저장됨.
        return this.commentsRepo.createComment({
            content, 
            userId,
            postId,
            parentId, 
        });
    }

    // 특정 게시물의 댓글 가져오기
    async getCommentsByPost(postId: number, parentId?: number) {
        if (parentId) {
            const parentComment = await this.commentsRepo.findCommentById(parentId);
            // 존재하지 않는 부모 댓글인 경우 404 처리
            if (!parentComment) {
                throw new NotFoundException('존재하지 않는 부모 댓글입니다.');
            }
        }

        return this.commentsRepo.findComments(postId, parentId);
    }

    // 댓글 수정 
    async update(id: number, updateCommentDto: UpdateCommentDto, userId: number) {
    const comment = await this.verifyCommentOwnership(id, userId);    
        const newContent = updateCommentDto.content?.trim();

        if (!newContent || newContent === comment.content) {
            return comment; // 수정할 내용이 없거나 공백일 경우 기존 댓글 반환
        }
        return this.commentsRepo.updateComment(id, newContent);
    }     

    // 댓글 삭제
    async delete(id: number, userId: number) {
        const comment = await this.verifyCommentOwnership(id, userId);
        return this.commentsRepo.deleteComment(id);
    }

    private async verifyCommentOwnership(commentId: number, userId: number) {
        const comment = await this.commentsRepo.findCommentById(commentId);
        if (!comment) {
            throw new NotFoundException('해당 댓글을 찾을 수 없습니다.');
        }
        if (comment.userId !== userId) {
            throw new ForbiddenException('해당 댓글에 대한 수정/삭제 권한이 없습니다.');
        }
        return comment;
    }
}

