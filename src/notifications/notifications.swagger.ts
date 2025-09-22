import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

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

const NotFoundResponse = () =>
  ApiResponse({
    status: 404,
    description: '요청한 리소스를 찾을 수 없음',
    content: {
      'application/json': {
        example: {
          message: '해당 알림을 찾을 수 없습니다.',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  });

// 래핑 함수
const withUnauthorizedResponses = () =>
  unauthorizedResponses(unauthorizedExamples);

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

const ApiResponseWithArrayData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  exampleData?: any[],
) => {
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
      example: {
        status: 'success',
        message: description,
        data: exampleData ?? [],
      },
    }),
  );
};

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

export const ApiNotifications = {
  stream: () =>
    applyDecorators(
      ApiOperation({
        summary: '알림 실시간 구독 (SSE)',
        description: `Server-Sent Events (SSE) 방식으로 알림을 실시간으로 수신합니다.
- 연결이 유지되며 이벤트가 발생할 때마다 클라이언트로 전송됩니다.
- 클라이언트에서 알림 뱃지를 갱신할 때 사용됩니다.`,
      }),
      ApiResponse({
        status: 200,
        description: '실시간 알림 이벤트 스트림',
        content: {
          'text/event-stream': {
            schema: {
              type: 'string',
              example: `data: {"type":"NEW_NOTIFICATION"}\n\n`,
            },
          },
        },
      }),
      withUnauthorizedResponses(),
    ),

  getList: () =>
    applyDecorators(
      ApiOperation({
        summary: '알림 목록 조회',
        description: '사용자의 알림 목록을 조회합니다.',
      }),
      ApiResponseWithArrayData(
        NotificationResponseDto,
        200,
        '알림 목록을 성공적으로 가져왔습니다.',
        [
          {
            id: 1,
            type: 'NEW_POST_IN_GROUP',
            message: "모동구에 새 게시물 '이제 가을이네요'가 등록되었습니다.",
            createdAt: '2025-09-18T12:00:00Z',
            isRead: false,
            payload: { groupId: 1, postId: 10 },
          },
          {
            id: 2,
            type: 'NEW_JOIN_REQUEST',
            message: "강승민님이 '모동구' 그룹 가입을 요청했습니다.",
            createdAt: '2025-09-16T12:44:54.914Z',
            isRead: true,
            payload: {
              groupId: 1,
            },
          },
        ],
      ),
      withUnauthorizedResponses(),
    ),

  markAsRead: () =>
    applyDecorators(
      ApiOperation({
        summary: '특정 알림 읽음 처리',
        description: '알림 ID를 지정하여 읽음 처리합니다.',
      }),
      successResponseNoData('알림이 성공적으로 읽음 처리되었습니다.'),
      withUnauthorizedResponses(),
      NotFoundResponse(),
    ),

  clearAll: () =>
    applyDecorators(
      ApiOperation({
        summary: '전체 알림 읽음 처리',
        description: '사용자의 모든 알림을 읽음 처리합니다.',
      }),
      successResponseNoData('모든 알림이 성공적으로 읽음 처리되었습니다.'),
      withUnauthorizedResponses(),
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({
        summary: '알림 삭제',
        description: '알림 ID를 지정하여 알림을 삭제합니다.',
      }),
      successResponseNoData('알림이 성공적으로 삭제되었습니다.'),
      withUnauthorizedResponses(),
      NotFoundResponse(),
    ),
};
