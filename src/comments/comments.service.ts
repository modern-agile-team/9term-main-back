import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from 'src/posts/posts.repository';
import { CommentsRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
    constructor(
        private readonly commentsRepo: CommentsRepository,
        private readonly postsRepo: PostsRepository,
    ) {}

    // 댓글 생성 (부모 댓글이 있을 경우 parentId 설정)
    async createComment(createCommentDto: CreateCommentDto, userId: number, postId: number, groupId: number) {
        const { content, parentId } = createCommentDto;

        await this.verifyPostAndGroup(postId, groupId);
        if (parentId) {
            const parentComment = await this.commentsRepo.findCommentById(parentId);
            if (!parentComment) {
                throw new NotFoundException('존재하지 않는 부모 댓글입니다.');
            }
            if (parentComment.postId !== postId) {
                throw new NotFoundException('존재하지 않는 부모 댓글이거나, 해당 게시글의 댓글이 아닙니다.');
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
    async getCommentsByPost(postId: number, groupId: number, parentId?: number) {
        await this.verifyPostAndGroup(postId, groupId);
        if (parentId) {
            const parentComment = await this.commentsRepo.findCommentById(parentId);
            if (!parentComment) {
                throw new NotFoundException('존재하지 않는 부모 댓글입니다.');
            }
            if (parentComment.postId !== postId) {
                throw new NotFoundException('존재하지 않는 부모 댓글이거나, 해당 게시글의 댓글이 아닙니다.');
            }
        }
        return this.commentsRepo.findComments(postId, parentId);
    }

    // 댓글 수정
    async updateComment(id: number, updateCommentDto: UpdateCommentDto, userId: number, groupId: number, postId: number) {
        await this.verifyPostAndGroup(postId, groupId);
        const comment = await this.verifyCommentOwnership(id, userId, postId);
        const newContent = updateCommentDto.content;

        if (newContent === undefined || newContent === comment.content) {
            return comment; // 수정할 내용이 없거나 공백일 경우 기존 댓글 반환
        }
        return this.commentsRepo.updateComment(id, newContent);
    }

    // 댓글 삭제
    async deleteComment(id: number, userId: number, groupId: number, postId: number) {
        await this.verifyPostAndGroup(postId, groupId);
        await this.verifyCommentOwnership(id, userId, postId);
        return this.commentsRepo.deleteComment(id);
    }

    private async verifyCommentOwnership(commentId: number, userId: number, postId: number) {
        const comment = await this.commentsRepo.findCommentById(commentId);

        if (!comment) {
            throw new NotFoundException('해당 댓글이 존재하지 않습니다.');
        }
        if (comment.postId !== postId) {
            throw new NotFoundException('해당 댓글이 게시글에 속하지 않습니다.');
        }
        if (comment.userId !== userId) {
            throw new ForbiddenException('해당 댓글을 수정하거나 삭제할 수 있는 권한이 없습니다.');
        }
        return comment;
    }

    private async verifyPostAndGroup(postId: number, groupId: number) {
        const post = await this.postsRepo.findPostById(postId);

        if (!post) {
            throw new NotFoundException('존재하지 않는 게시글입니다.');
        }
        if (post.groupId !== groupId) {
            throw new BadRequestException('해당 그룹에 속하지 않는 게시글입니다.');
        }
        return post;
    }
}