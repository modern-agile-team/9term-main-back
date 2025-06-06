import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ResPostDto } from './dto/res-post.dto';
import { ApiResponseDto } from './dto/api-response.dto';

/**
 * 인증 실패 공통 응답
 */
const unauthorizedResponse = () =>
  ApiResponse({
    status: 401,
    description: '인증되지 않음 (JWT 토큰 없음 또는 유효하지 않음)',
    content: {
      'application/json': {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    },
  });

/**
 * 공통 단일 객체 응답 스키마 생성
 */
function ApiResponseWithData<T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
) {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
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
    }),
  );
}

/**
 * 공통 배열 객체 응답 스키마 생성
 */
function ApiArrayResponseWithData<T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
) {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}

export const ApiPosts = {
  create: () =>
    applyDecorators(
      ApiOperation({ summary: '게시물 생성' }),
      ApiResponseWithData(
        ResPostDto,
        201,
        '게시물이 성공적으로 생성되었습니다.',
      ),
      ApiResponse({
        status: 400,
        description: '잘못된 요청입니다.',
        content: {
          'application/json': {
            example: {
              statusCode: 400,
              message: ['제목은 비워둘 수 없습니다.'],
              error: 'Bad Request',
            },
          },
        },
      }),
      unauthorizedResponse(),
    ),

  getAll: () =>
    applyDecorators(
      ApiOperation({ summary: '모든 게시물 조회' }),
      ApiArrayResponseWithData(
        ResPostDto,
        200,
        '게시물 목록을 성공적으로 가져왔습니다.',
      ),
      unauthorizedResponse(),
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({ summary: '특정 게시물 조회' }),
      ApiResponseWithData(ResPostDto, 200, '게시물을 성공적으로 가져왔습니다.'),
      ApiResponse({
        status: 404,
        description: '게시물을 찾을 수 없음',
        content: {
          'application/json': {
            example: {
              statusCode: 404,
              message: '게시물 1을 찾을 수 없습니다.',
              error: 'Not Found',
            },
          },
        },
      }),
      unauthorizedResponse(),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: '게시물 수정' }),
      ApiResponseWithData(
        ResPostDto,
        200,
        '게시물이 성공적으로 수정되었습니다.',
      ),
      ApiResponse({
        status: 404,
        description: '게시물을 찾을 수 없음',
        content: {
          'application/json': {
            example: {
              statusCode: 404,
              message: '게시물 3을 찾을 수 없습니다.',
              error: 'Not Found',
            },
          },
        },
      }),
      unauthorizedResponse(),
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: '게시물 삭제' }),
      ApiResponse({
        status: 200,
        description: '게시물이 성공적으로 삭제됨',
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
      ApiResponse({
        status: 404,
        description: '게시물을 찾을 수 없음',
        content: {
          'application/json': {
            example: {
              statusCode: 404,
              message: '게시물 2를 찾을 수 없습니다.',
              error: 'Not Found',
            },
          },
        },
      }),
      unauthorizedResponse(),
    ),
};
