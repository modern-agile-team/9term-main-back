import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserGroupRole } from '@prisma/client';

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

const BadRequestExamples = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          MissingRequired: {
            value: {
              message: ['필수 값이 누락되었습니다.'],
              error: 'Bad Request',
              statusCode: 400,
            },
          },
          InvalidFormat: {
            value: {
              message: ['name은 1~50자여야 합니다.'],
              error: 'Bad Request',
              statusCode: 400,
            },
          },
        },
      },
    },
  });

const NotFoundExamples = (
  targets: Array<'Group' | 'User' | 'Membership'> = ['Group'],
) =>
  ApiResponse({
    status: 404,
    description: `${targets.join(', ')} 리소스를 찾을 수 없음`,
    content: {
      'application/json': {
        examples: {
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
          ...(targets.includes('User') && {
            UserNotFound: {
              summary: 'UserNotFound',
              value: {
                message: 'ID가 {userId}인 사용자를 찾을 수 없습니다.',
                error: 'Not Found',
                statusCode: 404,
              },
            },
          }),
          ...(targets.includes('Membership') && {
            MembershipNotFound: {
              summary: 'MembershipNotFound',
              value: {
                message: '그룹 가입 정보를 찾을 수 없습니다.',
                error: 'Not Found',
                statusCode: 404,
              },
            },
          }),
        },
      },
    },
  });

const ConflictExamples = () =>
  ApiResponse({
    status: 409,
    description: '중복 리소스',
    content: {
      'application/json': {
        examples: {
          DuplicateGroupName: {
            value: {
              message: '이미 존재하는 그룹 이름입니다.',
              error: 'Conflict',
              statusCode: 409,
            },
          },
          AlreadyJoined: {
            value: {
              message: '이미 가입된 사용자입니다.',
              error: 'Conflict',
              statusCode: 409,
            },
          },
        },
      },
    },
  });

export const ApiGroups = {
  create: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 생성',
        description: '새로운 그룹을 생성합니다.',
      }),
      ApiResponse({
        status: 201,
        description: '그룹 생성 완료',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '그룹이 성공적으로 생성되었습니다.',
              data: {
                id: 1,
                name: '프론트엔드 스터디',
                description: 'React와 TypeScript를 공부하는 모임입니다.',
                createdAt: '2025-06-30T12:34:56.789Z',
              },
            },
          },
        },
      }),
      BadRequestExamples(),
      ConflictExamples(),
      UnauthorizedExamples(),
    ),

  getAll: () =>
    applyDecorators(
      ApiOperation({
        summary: '모든 그룹 목록 조회',
        description: '그룹 목록을 조회합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '그룹 목록 조회 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '그룹 목록을 성공적으로 가져왔습니다.',
              data: [
                {
                  id: 1,
                  name: '프론트엔드 스터디',
                  description: 'React와 TypeScript를 공부하는 모임입니다.',
                  createdAt: '2025-06-30T12:34:56.789Z',
                  memberCount: 8,
                },
              ],
            },
          },
        },
      }),
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 단건 조회 + 가입 상태',
        description:
          '그룹 정보를 조회하고, 로그인 시 가입 상태도 함께 반환합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '그룹 조회 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '그룹 ID 2의 정보를 성공적으로 가져왔습니다.',
              data: {
                isJoined: true,
                role: UserGroupRole.MANAGER,
              },
            },
          },
        },
      }),
      NotFoundExamples(['Group']),
    ),

  join: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 가입',
        description: '해당 그룹에 사용자를 가입시킵니다.',
      }),
      ApiResponse({
        status: 201,
        description: '가입 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '가입이 성공적으로 되었습니다!',
              data: {
                userId: 1,
                groupId: 10,
                role: 'MEMBER',
              },
            },
          },
        },
      }),
      BadRequestExamples(),
      ConflictExamples(),
      NotFoundExamples(['Group', 'User']),
      UnauthorizedExamples(),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 정보 수정',
        description: '그룹 이름/설명을 수정합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '수정 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '그룹 정보가 성공적으로 수정되었습니다.',
              data: {
                id: 1,
                name: '수정된 스터디명',
                description: '내용이 수정되었습니다.',
                createdAt: '2025-06-30T12:34:56.789Z',
              },
            },
          },
        },
      }),
      BadRequestExamples(),
      NotFoundExamples(['Group']),
      UnauthorizedExamples(),
    ),

  updateImage: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 이미지 변경',
        description: '그룹 이미지를 변경/삭제합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '그룹 이미지 변경 성공',
        content: {
          'aplication/json': {
            example: {
              status: `success`,
              message: '그룹 이미지가 성공적으로 변경되었습니다.',
              data: {
                id: 1,
                name: '프론트엔드 스터디',
                description: 'React와 TypeScript를 공부하는 모임입니다.',
                createdAt: '2025-06-30T12:34:56.789Z',
                groupImageUrl:
                  'https://example-s3.amazonaws.com/group/xxxx.png',
              },
            },
          },
        },
      }),
      NotFoundExamples(['Group']),
      UnauthorizedExamples(),
    ),

  remove: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 삭제',
        description: '그룹을 삭제합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '그룹 삭제 성공',
        content: {
          'appliction/json': {
            example: {
              status: 'success',
              message: '그룹이 성공적으로 삭제되었습니다.',
              data: null,
            },
          },
        },
      }),
      NotFoundExamples(['Group']),
      UnauthorizedExamples(),
    ),
};
