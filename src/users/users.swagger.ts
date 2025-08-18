import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/responses/user-profile.dto';

// 공통 Unauthorized
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

// 공통 Not Found
const notFoundExamples = {
  UserNotFound: {
    message: '존재하지 않는 사용자입니다.',
    error: 'Not Found',
    statusCode: 404,
  },
};

// 래핑 함수
const withUnauthorizedResponses = () =>
  unauthorizedResponses(unauthorizedExamples);

const withNotFoundResponses = (keys: (keyof typeof notFoundExamples)[]) =>
  NotFoundResponses(
    keys.reduce(
      (obj, key) => {
        obj[key] = notFoundExamples[key];
        return obj;
      },
      {} as Record<string, any>,
    ),
  );

// 성공 응답
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

// 클라이언트 요청 오류 응답
const badRequestResponse = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        example: {
          message: '프로필 이미지를 업데이트하려면 파일이 필요합니다.',
          error: 'Bad Request',
          statusCode: 400,
        },
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

// 리소스 없음
const NotFoundResponses = (examples: {
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

export const ApiUsers = {
  getProfile: () =>
    applyDecorators(
      ApiOperation({
        summary: '유저 프로필 조회',
        description: '로그인한 유저의 프로필 정보를 조회합니다.',
      }),
      ApiResponseWithData(UserProfileDto, 200, '내 정보 조회 성공'),
      withUnauthorizedResponses(),
      withNotFoundResponses(['UserNotFound']),
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
      badRequestResponse(),
      withUnauthorizedResponses(),
      withNotFoundResponses(['UserNotFound']),
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
      withUnauthorizedResponses(),
      withNotFoundResponses(['UserNotFound']),
    ),
};
