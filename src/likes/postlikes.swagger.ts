import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

const UnauthorizedExamples = () =>
  ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    content: {
      'application/json': {
        examples: {
          TokenExpired: {
            value: {
              message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
          InvalidToken: {
            value: {
              message: '유효하지 않은 토큰입니다.',
              error: 'Unauthorized',
              statusCode: 401,
            },
          },
        },
      },
    },
  });

const NotFoundExamples = () =>
  ApiResponse({
    status: 404,
    description: '그룹 또는 게시물이 존재하지 않음',
    content: {
      'application/json': {
        examples: {
          GroupNotFound: {
            summary: 'GroupNotFound',
            value: {
              message: '존재하지 않는 그룹입니다.',
              error: 'Not Found',
              statusCode: 404,
            },
          },
          PostNotFound: {
            summary: 'PostNotFound',
            value: {
              message: '존재하지 않는 게시물입니다.',
              error: 'Not Found',
              statusCode: 404,
            },
          },
          PostGroupMismatch: {
            summary: 'PostGroupMismatch',
            value: {
              message:
                'ID가 {postId}인 게시물은 ID가 {groupId}인 그룹에 속한 게시물이 아닙니다.',
              error: 'Not Found',
              statusCode: 404,
            },
          },
        },
      },
    },
  });

const ToggleLikeResponses = () =>
  ApiResponse({
    status: 200,
    description: '좋아요 토글 처리 완료',
    content: {
      'application/json': {
        examples: {
          Liked: {
            summary: 'Liked',
            value: {
              status: 'success',
              data: {
                isLiked: true,
              },
            },
          },
          Unliked: {
            summary: 'LikeRemoved',
            value: {
              status: 'success',
              data: {
                isLiked: false,
              },
            },
          },
        },
      },
    },
  });

export const ApiLikes = {
  toggleLike: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 좋아요',
        description: '게시물에 좋아요를 누르거나 취소합니다.',
      }),
      ToggleLikeResponses(),
      NotFoundExamples(),
      UnauthorizedExamples(),
    ),
};
