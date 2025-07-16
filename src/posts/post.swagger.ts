import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from './dto/responses/api-response.dto';
import { PostWriteResponseDto } from './dto/responses/post-write-response.dto';
import { PostResponseDto } from './dto/responses/post-response.dto';

// ✅ 공통 Unauthorized 예시
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

// ✅ 공통 NotFound 예시
const notFoundExamples = {
  PostNotFound: {
    message: '존재하지 않는 게시글입니다.',
    error: 'Not Found',
    statusCode: 404,
  },
};

// ✅ 공통 데코레이터 함수
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

const ApiResponseWithData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  example?: Record<string, any>,
) =>
  applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: getSchemaPath(ApiResponseDto) },
              {
                properties: {
                  data: { $ref: getSchemaPath(model) },
                },
              },
            ],
          },
          ...(example && {
            example: {
              status: 'success',
              message: description,
              data: example,
            },
          }),
        },
      },
    }),
  );

const ApiResponseWithArrayData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  examples?: any[],
) =>
  applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: description },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
          ...(examples && {
            example: {
              status: 'success',
              message: description,
              data: examples,
            },
          }),
        },
      },
    }),
  );

const successResponseNoData = (message: string, status = 200) =>
  ApiResponse({
    status,
    description: message,
    content: {
      'application/json': {
        example: {
          status: 'success',
          message,
          data: null,
        },
      },
    },
  });

const badRequestResponse = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        example: {
          message: ['제목은 비워둘 수 없습니다.'],
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
          (acc, [name, value]) => {
            acc[name] = { value };
            return acc;
          },
          {} as Record<string, any>,
        ),
      },
    },
  });

const NotFoundResponses = (examples: {
  [key: string]: { message: string; error: string; statusCode: number };
}) =>
  ApiResponse({
    status: 404,
    description: '요청한 리소스를 찾을 수 없음',
    content: {
      'application/json': {
        examples: Object.entries(examples).reduce(
          (acc, [name, value]) => {
            acc[name] = { value };
            return acc;
          },
          {} as Record<string, any>,
        ),
      },
    },
  });

export const ApiPosts = {
  create: () =>
    applyDecorators(
      ApiBearerAuth('access-token'),
      ApiOperation({ summary: '게시물 생성' }),
      ApiResponseWithData(
        PostWriteResponseDto,
        201,
        '게시물이 성공적으로 생성되었습니다.',
        {
          id: 1,
          userId: 2,
          groupId: 3,
          title: '제목',
          content: '본문',
          createdAt: '2025-07-01T10:00:00Z',
          updatedAt: null,
        },
      ),
      badRequestResponse(),
      withUnauthorizedResponses(),
    ),

  getAll: () =>
    applyDecorators(
      ApiBearerAuth('access-token'),
      ApiOperation({ summary: '게시물 목록 조회' }),
      ApiResponseWithArrayData(
        PostResponseDto,
        200,
        '게시물 목록을 성공적으로 가져왔습니다.',
        [
          {
            id: 1,
            userId: 2,
            groupId: 3,
            title: '제목',
            content: '본문',
            createdAt: '2025-07-01T10:00:00Z',
            updatedAt: null,
            user: { id: 2, name: '홍길동' },
            commentsCount: 5,
          },
        ],
      ),
      withUnauthorizedResponses(),
    ),

  getOne: () =>
    applyDecorators(
      ApiBearerAuth('access-token'),
      ApiOperation({ summary: '게시물 단건 조회' }),
      ApiResponseWithData(
        PostResponseDto,
        200,
        '게시물을 성공적으로 가져왔습니다.',
        {
          id: 1,
          userId: 2,
          groupId: 3,
          title: '제목',
          content: '본문',
          createdAt: '2025-07-01T10:00:00Z',
          updatedAt: null,
          user: { id: 2, name: '홍길동' },
          commentsCount: 5,
        },
      ),
      withNotFoundResponses(['PostNotFound']),
      withUnauthorizedResponses(),
    ),

  update: () =>
    applyDecorators(
      ApiBearerAuth('access-token'),
      ApiOperation({ summary: '게시물 수정' }),
      ApiResponseWithData(
        PostResponseDto,
        200,
        '게시물이 성공적으로 수정되었습니다.',
      ),
      withNotFoundResponses(['PostNotFound']),
      withUnauthorizedResponses(),
    ),

  delete: () =>
    applyDecorators(
      ApiBearerAuth('access-token'),
      ApiOperation({ summary: '게시물 삭제' }),
      successResponseNoData('게시물이 성공적으로 삭제되었습니다.'),
      withNotFoundResponses(['PostNotFound']),
      withUnauthorizedResponses(),
    ),
};
