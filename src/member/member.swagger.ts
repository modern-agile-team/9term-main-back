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
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import {
  UpdateMemberStatusDto,
  MemberAction,
} from './dto/update-member-status.dto';

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
      ApiOperation({
        summary: '그룹 가입 신청',
        description:
          '그룹에 가입을 신청합니다. 성공 시 생성된 멤버 정보를 반환합니다.',
      }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiBody({ type: JoinMemberRequestDto }),
      ApiResponseWithData(Object, 201, '그룹 가입 신청 성공', {
        message: '가입 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.',
        member: {
          /* MemberResponseDto 구조 */
        },
      }),
      conflictResponse('이미 신청 중이거나 가입된 그룹입니다.'),
      badRequestResponse(),
      unauthorizedResponse(),
    ),

  updateStatus: () =>
    applyDecorators(
      ApiOperation({
        summary: '멤버 상태 변경 통합 API',
        description:
          '멤버의 상태를 변경합니다. APPROVE/REJECT는 매니저만, LEFT는 본인만 가능합니다.',
      }),
      ApiParam({ name: 'groupId', type: Number, description: '그룹 ID' }),
      ApiParam({
        name: 'id',
        type: Number,
        description: '대상 멤버의 사용자 ID',
      }),
      ApiBody({
        type: UpdateMemberStatusDto,
        examples: {
          approve: {
            summary: '가입 승인 (매니저 전용)',
            value: { action: MemberAction.APPROVE },
          },
          reject: {
            summary: '가입 거절 (매니저 전용)',
            value: { action: MemberAction.REJECT },
          },
          leave: {
            summary: '그룹 탈퇴 (본인만)',
            value: { action: MemberAction.LEFT },
          },
        },
      }),
      ApiResponseWithData(Object, 200, '상태 변경 성공', {
        message: '작업이 성공적으로 완료되었습니다.',
        member: {
          /* MemberResponseDto 구조 */
        },
      }),
      unauthorizedResponse(),
      forbiddenResponse('권한이 없습니다.'),
      conflictResponse('처리할 수 없는 요청입니다.'),
    ),
};
export function MemberSwagger() {
  return applyDecorators(ApiTags('Member'));
}
