import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PostCategory } from '@prisma/client';

const unauthorizedExamples = () =>
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

const forbiddenExamples = () =>
  ApiResponse({
    status: 403,
    description: '권한 없음',
    content: {
      'application/json': {
        examples: {
          NotAuthor: {
            value: {
              message: '게시물 수정/삭제 권한이 없습니다.',
              error: 'Forbidden',
              statusCode: 403,
            },
          },
        },
      },
    },
  });

const badRequestExamples = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          MissingRequired: {
            value: {
              message: ['제목과 내용은 비워둘 수 없습니다.'],
              error: 'Bad Request',
              statusCode: 400,
            },
          },
          InvalidCategory: {
            value: {
              message: ['category 값이 올바르지 않습니다.'],
              error: 'Bad Request',
              statusCode: 400,
            },
          },
        },
      },
    },
  });

const notFoundExamples = (targets: Array<'Post' | 'Group'> = ['Post']) =>
  ApiResponse({
    status: 404,
    description: `${targets.join(', ')} 리소스를 찾을 수 없음`,
    content: {
      'application/json': {
        examples: {
          ...(targets.includes('Post') && {
            PostNotFound: {
              summary: 'PostNotFound',
              value: {
                message: 'ID가 {postId}인 게시물을 찾을 수 없습니다.',
                error: 'Not Found',
                statusCode: 404,
              },
            },
          }),
          ...(targets.includes('Group') && {
            GroupNotFound: {
              summary: 'GroupNotFound',
              value: {
                message: 'ID가 {groupId}인 그룹을 찾을 수 없습니다.',
                error: 'Not Found',
                statusCode: 404,
              },
            },
          }),
        },
      },
    },
  });

export const ApiPosts = {
  create: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 생성',
        description: '새로운 게시물을 생성합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '게시물이 소속될 그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', example: '첫 번째 글' },
            content: {
              type: 'string',
              example: '안녕하세요! 본문 내용입니다.',
            },
            category: {
              type: 'string',
              enum: Object.values(PostCategory),
              example: PostCategory.NORMAL,
              description: `게시물 분류 (예: ${Object.values(PostCategory).join(', ')})`,
            },
            postImage: {
              type: 'string',
              format: 'binary',
              description: '업로드할 이미지 파일(선택)',
            },
          },
          required: ['title', 'content'],
        },
      }),
      ApiResponse({
        status: 201,
        description: '게시물 생성 완료',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물이 성공적으로 생성되었습니다.',
              data: {
                id: 118,
                groupId: 15,
                user: {
                  id: 12,
                  name: '권혁진',
                  profileImageUrl:
                    'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/1.jpg',
                },
                createdAt: '2025-08-08T04:42:01.057Z',
                updatedAt: null,
                category: 'NORMAL',
                title: '이하',
                content: '서',
                postImageUrl:
                  'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/1.jpg',
                commentsCount: 0,
                likesCount: 0,
                isLiked: false,
              },
            },
          },
        },
      }),
      badRequestExamples(),
      unauthorizedExamples(),
    ),

  getAll: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 내 게시물 목록 조회',
        description: '특정 그룹의 게시물 목록을 조회합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiResponse({
        status: 200,
        description: '게시물 목록 조회 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물 목록을 성공적으로 가져왔습니다.',
              data: [
                {
                  id: 118,
                  groupId: 15,
                  user: {
                    id: 12,
                    name: '권혁진',
                    profileImageUrl:
                      'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/1.jpg',
                  },
                  createdAt: '2025-08-08T04:42:01.057Z',
                  updatedAt: null,
                  category: 'NORMAL',
                  title: '이하',
                  content: '서',
                  postImageUrl:
                    'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/1.jpg',
                  commentsCount: 1,
                  likesCount: 0,
                  isLiked: false,
                },
                {
                  id: 117,
                  groupId: 15,
                  user: {
                    id: 8,
                    name: '홍길동',
                    profileImageUrl:
                      'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/user_uploads/12345678-example.jpg',
                  },
                  createdAt: '2025-08-07T10:11:22.333Z',
                  updatedAt: '2025-08-07T12:00:00.000Z',
                  category: 'ANNOUNCEMENT',
                  title: '공지입니다',
                  content: '공지 본문...',
                  postImageUrl: null,
                  commentsCount: 0,
                  likesCount: 2,
                  isLiked: true,
                },
              ],
            },
          },
        },
      }),
      notFoundExamples(['Group']),
      unauthorizedExamples(),
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 단건 조회',
        description: '게시물 상세 정보를 조회합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiParam({
        name: 'postId',
        required: true,
        description: '게시물 ID',
        schema: { type: 'integer', example: 118 },
      }),
      ApiResponse({
        status: 200,
        description: '게시물 조회 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물을 성공적으로 가져왔습니다.',
              data: {
                id: 118,
                groupId: 15,
                user: {
                  id: 12,
                  name: '권혁진',
                  profileImageUrl:
                    'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/2.jpg',
                },
                createdAt: '2025-08-08T04:42:01.057Z',
                updatedAt: null,
                category: 'NORMAL',
                title: '이하',
                content: '서',
                postImageUrl:
                  'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/2.jpg',
                commentsCount: 1,
                likesCount: 0,
                isLiked: false,
              },
            },
          },
        },
      }),
      notFoundExamples(['Post']),
      unauthorizedExamples(),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 수정',
        description: '게시물의 제목/내용/분류를 수정합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiParam({
        name: 'postId',
        required: true,
        description: '게시물 ID',
        schema: { type: 'integer', example: 118 },
      }),
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', example: '수정된 제목' },
            content: { type: 'string', example: '수정된 본문 내용' },
            category: {
              type: 'string',
              enum: Object.values(PostCategory),
              example: PostCategory.NORMAL,
            },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: '게시물 수정 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물이 성공적으로 수정되었습니다.',
              data: {
                id: 118,
                groupId: 15,
                user: {
                  id: 12,
                  name: '권혁진',
                  profileImageUrl:
                    'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/1.jpg',
                },
                createdAt: '2025-08-08T04:42:01.057Z',
                updatedAt: '2025-08-09T08:21:00.000Z',
                category: 'NORMAL',
                title: '수정된 제목',
                content: '수정된 본문 내용',
                postImageUrl:
                  'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/2.jpg',
                commentsCount: 1,
                likesCount: 0,
                isLiked: false,
              },
            },
          },
        },
      }),
      badRequestExamples(),
      notFoundExamples(['Post']),
      forbiddenExamples(),
      unauthorizedExamples(),
    ),

  remove: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 삭제',
        description: '게시물을 삭제합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiParam({
        name: 'postId',
        required: true,
        description: '게시물 ID',
        schema: { type: 'integer', example: 118 },
      }),
      ApiResponse({
        status: 200,
        description: '게시물 삭제 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물이 성공적으로 삭제되었습니다.',
              data: null,
            },
          },
        },
      }),
      notFoundExamples(['Post']),
      forbiddenExamples(),
      unauthorizedExamples(),
    ),
};
