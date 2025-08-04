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

const getBaseNotFoundExamples = () => ({
  GroupNotFound: {
    summary: 'GroupNotFound',
    value: {
      message: 'ID가 {groupId}인 그룹을 찾을 수 없습니다.',
      error: 'Not Found',
      statusCode: 404,
    },
  },
  PostNotFound: {
    summary: 'PostNotFound',
    value: {
      message: 'ID가 {postId}인 게시물을 찾을 수 없습니다.',
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
});

const getLikeNotFoundExample = () => ({
  LikeNotFound: {
    summary: 'LikeNotFound',
    value: {
      message: '해당 게시물에 좋아요를 누르지 않았습니다.',
      error: 'Not Found',
      statusCode: 404,
    },
  },
});

const NotFoundExamples = (includeLikedNotFound: boolean) =>
  ApiResponse({
    status: 404,
    description: includeLikedNotFound
      ? '그룹, 게시물 또는 좋아요가 존재하지 않음'
      : '그룹 또는 게시물이 존재하지 않음',
    content: {
      'application/json': {
        examples: {
          ...getBaseNotFoundExamples(),
          ...(includeLikedNotFound ? getLikeNotFoundExample() : {}),
        },
      },
    },
  });

const ConflictExamples = () =>
  ApiResponse({
    status: 409,
    description: '좋아요 중복',
    content: {
      'application/json': {
        example: {
          message: '이미 좋아요를 누른 게시물입니다.',
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  });

export const ApiLikes = {
  createLike: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 좋아요 추가',
        description: '게시물에 좋아요를 추가합니다.',
      }),
      ApiResponse({
        status: 201,
        description: '좋아요 추가 완료',
        content: {
          'application/json': {
            example: {
              status: 'success',
              data: {
                isLiked: true,
              },
            },
          },
        },
      }),
      NotFoundExamples(false),
      UnauthorizedExamples(),
      ConflictExamples(),
    ),

  deleteLike: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 좋아요 취소',
        description: '게시물에 좋아요를 취소(삭제)합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '좋아요 취소 완료',
        content: {
          'application/json': {
            example: {
              status: 'success',
              data: {
                isLiked: false,
              },
            },
          },
        },
      }),
      NotFoundExamples(true),
      UnauthorizedExamples(),
    ),
};
