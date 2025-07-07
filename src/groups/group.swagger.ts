import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from './dto/api-response.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupWithMemberCountDto } from './dto/group-with-member-count.dto';
import { GroupJoinStatusDto } from './dto/group-join-status.dto';
import { GroupUserResponseDto } from './dto/group-user-response.dto';

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

const badRequestResponse = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          message: ['필수 값이 누락되었습니다.'],
          error: 'Bad Request',
        },
      },
    },
  });

const notFoundResponse = (message = '리소스를 찾을 수 없습니다.') =>
  ApiResponse({
    status: 404,
    description: message,
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message,
          error: 'Not Found',
        },
      },
    },
  });

const conflictResponse = (message = '중복된 리소스입니다.') =>
  ApiResponse({
    status: 409,
    description: message,
    content: {
      'application/json': {
        example: {
          statusCode: 409,
          message,
          error: 'Conflict',
        },
      },
    },
  });

function ApiResponseWithData<T>(
  model: Type<T>,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  example?: any,
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
        ...(example ? { example } : {}),
      },
    }),
  );
}

function ApiArrayResponseWithData<T>(
  model: Type<T>,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  example?: any,
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
        ...(example ? { example } : {}),
      },
    }),
  );
}

export const ApiGroups = {
  create: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 생성' }),
      ApiResponseWithData(
        GroupResponseDto,
        201,
        '그룹이 성공적으로 생성되었습니다.',
        {
          status: 'success',
          message: '그룹이 성공적으로 생성되었습니다.',
          data: {
            id: 1,
            name: '프론트엔드 스터디',
            description: 'React와 TypeScript를 공부하는 모임입니다.',
            createdAt: '2025-06-30T12:34:56.789Z',
          },
        },
      ),
      badRequestResponse(),
      conflictResponse('이미 존재하는 그룹 이름입니다.'),
      unauthorizedResponse(),
    ),

  getAll: () =>
    applyDecorators(
      ApiOperation({ summary: '모든 그룹 목록 조회' }),
      ApiArrayResponseWithData(
        GroupWithMemberCountDto,
        200,
        '그룹 목록을 성공적으로 가져왔습니다.',
        {
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
      ),
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 단건 조회 + 가입 상태 확인' }),
      ApiResponseWithData(
        GroupJoinStatusDto,
        200,
        '그룹 ID의 정보를 성공적으로 가져왔습니다.',
        {
          status: 'success',
          message: '그룹 ID 2의 정보를 성공적으로 가져왔습니다.',
          data: {
            isJoined: true,
            role: 'admin',
          },
        },
      ),
      notFoundResponse('해당 그룹을 찾을 수 없습니다.'),
    ),

  join: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 가입' }),
      ApiResponseWithData(
        GroupUserResponseDto,
        201,
        '가입이 성공적으로 되었습니다!',
        {
          status: 'success',
          message: '가입이 성공적으로 되었습니다!',
          data: {
            userId: 1,
            groupId: 10,
            role: 'member',
          },
        },
      ),
      badRequestResponse(),
      conflictResponse('이미 가입된 사용자입니다.'),
      notFoundResponse('해당 그룹을 찾을 수 없습니다.'),
      unauthorizedResponse(),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 정보 수정' }),
      ApiResponseWithData(
        GroupResponseDto,
        200,
        '그룹 정보가 성공적으로 수정되었습니다.',
        {
          status: 'success',
          message: '그룹 정보가 성공적으로 수정되었습니다.',
          data: {
            id: 1,
            name: '수정된 스터디명',
            description: '내용이 수정되었습니다.',
            createdAt: '2025-06-30T12:34:56.789Z',
          },
        },
      ),
      badRequestResponse(),
      notFoundResponse('수정하려는 그룹이 존재하지 않습니다.'),
      unauthorizedResponse(),
    ),
};
