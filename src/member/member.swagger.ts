import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
  ApiTags,
} from '@nestjs/swagger';
import { MemberResponseDto } from './dto/member-response.dto';
import { JoinGroupDto } from '../groups/dto/join-group.dto';

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

const notFoundResponse = (message = '그룹 멤버가 존재하지 않습니다.') =>
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

const conflictResponse = (message = '이미 이 그룹에 가입되어 있습니다.') =>
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

const forbiddenResponse = (message = '접근이 금지되었습니다.') =>
  ApiResponse({
    status: 403,
    description: message,
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          message,
          error: 'Forbidden',
        },
      },
    },
  });

const internalServerErrorResponse = (message = '유저 정보가 없습니다.') =>
  ApiResponse({
    status: 500,
    description: message,
    content: {
      'application/json': {
        example: {
          statusCode: 500,
          message,
          error: 'Internal Server Error',
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
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [{ $ref: getSchemaPath(model) }],
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
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
        ...(example ? { example } : {}),
      },
    }),
  );
}

export const ApiMembers = {
  getList: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 멤버 목록 조회' }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiArrayResponseWithData(MemberResponseDto, 200, '멤버 목록 조회 성공'),
      unauthorizedResponse(),
      notFoundResponse('해당 그룹을 찾을 수 없습니다.'),
      internalServerErrorResponse('유저 정보가 없습니다.'),
    ),

  getOne: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 내 특정 멤버 조회' }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiParam({ name: 'id', type: Number, description: '멤버 PK(ID)' }),
      ApiResponseWithData(MemberResponseDto, 200, '멤버 조회 성공'),
      notFoundResponse('그룹 멤버가 존재하지 않습니다.'),
      unauthorizedResponse(),
    ),

  join: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 가입' }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiBody({ type: JoinGroupDto }),
      ApiResponseWithData(MemberResponseDto, 201, '그룹 가입 성공'),
      conflictResponse('이미 이 그룹에 가입되어 있습니다.'),
      badRequestResponse(),
      unauthorizedResponse(),
    ),

  remove: () =>
    applyDecorators(
      ApiOperation({ summary: '그룹 멤버 삭제(매니저/어드민만 가능)' }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiParam({ name: 'id', type: Number, description: '멤버 PK(ID)' }),
      ApiResponse({
        status: 200,
        description: '삭제 완료',
        schema: {
          example: { message: '삭제가 완료되었습니다.' },
        },
      }),
      notFoundResponse('삭제할 멤버가 존재하지 않습니다.'),
      unauthorizedResponse(),
      forbiddenResponse('이 그룹의 매니저 또는 어드민만 접근할 수 있습니다.'),
    ),
};

export function MemberSwagger() {
  return applyDecorators(ApiTags('Member'));
}
