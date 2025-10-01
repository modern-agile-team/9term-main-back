import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';
import { UserGroupSummaryDto } from './dto/responses/user-group-summary.dto';
import {
  UserProfileDto,
  UserProfileNextDateDto,
} from './dto/responses/user-profile.dto';

// 응답 예시
const successExamples = {
  NameChanged: {
    summary: '이름 변경 성공',
    value: {
      status: 'success',
      message: '이름이 성공적으로 변경되었습니다.',
      data: {
        userId: 1,
        name: '새로운닉네임',
        username: 'user123',
        profileImageUrl: 'https://example.com/profile/default_1.png',
        nextAvailableDate: '2025-10-30T00:00:00.000Z',
      },
    },
  },
  NoChange: {
    summary: '동일한 이름 입력 (변경 없음)',
    value: {
      status: 'success',
      message: '이름이 성공적으로 변경되었습니다.',
      data: {
        userId: 1,
        name: '기존닉네임',
        username: 'user123',
        profileImageUrl: 'https://example.com/profile/default_1.png',
      },
    },
  },
};

const unauthorizedExamples = {
  TokenExpired: {
    message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
    error: 'Unauthorized',
    statusCode: 401,
  },
  InvalidToken: {
    message: '유효하지 않은 토큰입니다.',
    error: 'Unauthorized',
    statusCode: 401,
  },
};

const notFoundExamples = {
  UserNotFound: {
    message: '존재하지 않는 사용자입니다.',
    error: 'Not Found',
    statusCode: 404,
  },
};

const badRequestExamples = {
  EmptyName: {
    message: '이름은 공백만으로 이루어질 수 없습니다.',
    error: 'Bad Request',
    statusCode: 400,
  },
  NameChangeRestricted: {
    message: '이름은 최근 변경일로부터 30일 이후에 다시 변경할 수 있습니다.',
    error: 'Bad Request',
    statusCode: 400,
  },
  FileRequired: {
    message: '프로필 이미지를 업데이트하려면 파일이 필요합니다.',
    error: 'Bad Request',
    statusCode: 400,
  },
};

// 응답 헬퍼 함수
const ApiResponseWithData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: description },
          data: { $ref: getSchemaPath(model) },
        },
      },
    }),
  );
};

const ApiArrayResponseWithData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: description },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
        },
      },
    }),
  );
};

const badRequestResponses = (examples: {
  [key: string]: { message: string; error: string; statusCode: number };
}) =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        examples: Object.entries(examples).reduce(
          (acc, [name, exValue]) => {
            acc[name] = {
              value: {
                message: exValue.message,
                error: exValue.error,
                statusCode: exValue.statusCode,
              },
            };
            return acc;
          },
          {} as { [key: string]: { value: any } },
        ),
      },
    },
  });

const unauthorizedResponses = (examples: {
  [key: string]: { message: string; error: string; statusCode: number };
}) =>
  ApiResponse({
    status: 401,
    description: '인증되지 않음 (JWT 토큰 없음 또는 유효하지 않음)',
    content: {
      'application/json': {
        examples: Object.entries(examples).reduce(
          (acc, [name, exValue]) => {
            acc[name] = {
              value: {
                message: exValue.message,
                error: exValue.error,
                statusCode: exValue.statusCode,
              },
            };
            return acc;
          },
          {} as { [key: string]: { value: any } },
        ),
      },
    },
  });

const notFoundResponses = (examples: {
  [key: string]: { message: string; error: string; statusCode: number };
}) =>
  ApiResponse({
    status: 404,
    description: '요청한 리소스를 찾을 수 없음',
    content: {
      'application/json': {
        examples: Object.entries(examples).reduce(
          (acc, [name, exValue]) => {
            acc[name] = {
              value: {
                message: exValue.message,
                error: exValue.error,
                statusCode: exValue.statusCode,
              },
            };
            return acc;
          },
          {} as { [key: string]: { value: any } },
        ),
      },
    },
  });

const withSuccessResponses = <T extends Type<any>>(
  model: T,
  keys: (keyof typeof successExamples)[],
  description = '성공 응답',
) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: 200,
      description,
      content: {
        'application/json': {
          schema: {
            $ref: getSchemaPath(model),
          },
          examples: keys.reduce(
            (acc, key) => {
              acc[key] = successExamples[key];
              return acc;
            },
            {} as Record<string, any>,
          ),
        },
      },
    }),
  );

const withBadRequestResponses = (keys: (keyof typeof badRequestExamples)[]) =>
  badRequestResponses(
    keys.reduce(
      (obj, key) => {
        obj[key] = badRequestExamples[key];
        return obj;
      },
      {} as Record<string, any>,
    ),
  );

export const ApiUsers = {
  getProfile: () =>
    applyDecorators(
      ApiOperation({
        summary: '유저 프로필 조회',
        description: '로그인한 유저의 프로필 정보를 조회합니다.',
      }),
      ApiArrayResponseWithData(
        UserProfileNextDateDto,
        200,
        '내 정보 조회 성공',
      ),
      unauthorizedResponses(unauthorizedExamples),
      notFoundResponses(notFoundExamples),
    ),

  updateProfileName: () =>
    applyDecorators(
      ApiOperation({
        summary: '유저 이름 수정',
        description: `유저의 이름을 변경합니다.
- 이름은 공백만으로 구성될 수 없으며  
- 최근 변경일로부터 30일 이후에 다시 변경할 수 있습니다.`,
      }),
      withSuccessResponses(UserProfileNextDateDto, ['NameChanged', 'NoChange']),
      withBadRequestResponses(['EmptyName', 'NameChangeRestricted']),
      unauthorizedResponses(unauthorizedExamples),
      notFoundResponses(notFoundExamples),
    ),

  updateProfileImage: () =>
    applyDecorators(
      ApiOperation({
        summary: '유저 프로필 수정',
        description: '유저 프로필 이미지를 수정합니다.',
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            profileImage: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      }),
      ApiResponseWithData(
        UserProfileDto,
        200,
        '프로필 이미지가 성공적으로 업데이트되었습니다.',
      ),
      withBadRequestResponses(['FileRequired']),
      unauthorizedResponses(unauthorizedExamples),
      notFoundResponses(notFoundExamples),
    ),

  deleteProfileImage: () =>
    applyDecorators(
      ApiOperation({
        summary: '기본 프로필로 변경',
        description: '유저 프로필을 기본 이미지로 변경합니다.',
      }),
      ApiResponseWithData(
        UserProfileDto,
        200,
        '프로필 이미지가 기본 이미지로 변경되었습니다.',
      ),
      unauthorizedResponses(unauthorizedExamples),
      notFoundResponses(notFoundExamples),
    ),

  getMyGroups: () =>
    applyDecorators(
      ApiOperation({
        summary: '내 그룹 목록 조회',
        description:
          '로그인한 유저가 속한 그룹 목록을 조회합니다. status 쿼리로 멤버십 상태를 필터링할 수 있습니다.',
      }),
      ApiQuery({
        name: 'status',
        required: false,
        enum: MembershipStatus,
        description: '멤버십 상태 필터 (PENDING | APPROVED)',
      }),
      ApiArrayResponseWithData(
        UserGroupSummaryDto,
        200,
        '내 그룹 목록 조회 성공',
      ),
      unauthorizedResponses(unauthorizedExamples),
    ),
};
