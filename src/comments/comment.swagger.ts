import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from './dto/api-response.dto';
import { ResCommentDto } from './dto/res-comment.dto';

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
  PostNotFound: {
    message: '존재하지 않는 게시글입니다.',
    error: 'Not Found',
    statusCode: 404,
  },
  CommentNotFound: {
    message: '존재하지 않는 댓글입니다.',
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
};

const ApiResponseWithArrayData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
  examples?: {
    parentOnly?: any[];
    childOnly?: any[];
    empty?: any[];
  },
) => {
  const exampleEntries: Record<string, { value: any }> = {};

  if (examples?.parentOnly) {
    exampleEntries['부모 댓글만 조회되는 경우 (parentId 쿼리 없음)'] = {
      value: {
        status: 'success',
        message: description,
        data: examples.parentOnly,
      },
    };
  }
  if (examples?.childOnly) {
    exampleEntries['자식 댓글만 조회되는 경우 (parentId 쿼리 있음)'] = {
      value: {
        status: 'success',
        message: description,
        data: examples.childOnly,
      },
    };
  }
  if (examples?.empty) {
    exampleEntries['댓글이 없을 경우'] = {
      value: {
        status: 'success',
        message: description,
        data: examples.empty,
      },
    };
  }

  return applyDecorators(
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
          examples:
            Object.keys(exampleEntries).length > 0 ? exampleEntries : undefined,
        },
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

// 클라이언트 요청 오류 응답
const badRequestResponse = () =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        example: {
          message: ['content must be a string', '댓글 내용은 필수입니다.'],
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

// 인증 / 권한 관련 응답
const forbiddenResponse = () =>
  ApiResponse({
    status: 403,
    description: '권한 없음',
    content: {
      'application/json': {
        example: {
          message: '해당 댓글을 수정하거나 삭제할 권한이 없습니다.',
          error: 'Forbidden',
          statusCode: 403,
        },
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

export const ApiComments = {
  create: () =>
    applyDecorators(
      ApiOperation({
        summary: '댓글 생성',
        description: '게시글에 댓글을 생성합니다.',
      }),
      ApiResponseWithData(
        ResCommentDto,
        201,
        '댓글이 성공적으로 생성되었습니다.',
      ),
      badRequestResponse(),
      withUnauthorizedResponses(),
      withNotFoundResponses(['PostNotFound']),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: '댓글 수정', description: '댓글을 수정합니다.' }),
      ApiResponseWithData(
        ResCommentDto,
        200,
        '댓글이 성공적으로 수정되었습니다.',
      ),
      forbiddenResponse(),
      withUnauthorizedResponses(),
      withNotFoundResponses(['PostNotFound', 'CommentNotFound']),
    ),

  delete: () =>
    applyDecorators(
      ApiOperation({ summary: '댓글 삭제', description: '댓글을 삭제합니다.' }),
      successResponseNoData('댓글이 성공적으로 삭제되었습니다.'),
      forbiddenResponse(),
      withUnauthorizedResponses(),
      withNotFoundResponses(['PostNotFound', 'CommentNotFound']),
    ),

  getList: () =>
    applyDecorators(
      ApiOperation({
        summary: '댓글 목록 조회',
        description: `parentId 쿼리 파라미터 유무에 따라 결과가 다릅니다.\n
        - parentId 없이 요청: 해당 게시글의 최상위 댓글 목록 조회
        - ?parentId=3 등으로 요청: 해당 댓글 ID의 대댓글 목록 조회`,
      }),
      ApiQuery({
        name: 'parentId',
        description: '부모 댓글 ID (없을 경우 null)',
        type: 'number',
        required: false,
        example: 1,
      }),
      ApiResponseWithArrayData(
        ResCommentDto,
        200,
        '댓글이 성공적으로 조회되었습니다.',
        {
          parentOnly: [
            {
              id: 1,
              postId: 1,
              userId: 6,
              content: '폭염 주의보래요.',
              parentId: null,
              createdAt: '2025-07-02T10:00:00Z',
              updatedAt: null,
              user: {
                name: '김남주',
              },
            },
          ],
          childOnly: [
            {
              id: 2,
              postId: 1,
              userId: 6,
              content: '다음에 만날까요?.',
              parentId: 1,
              createdAt: '2025-07-02T10:05:00Z',
              updatedAt: null,
              user: {
                name: '김여주',
              },
            },
          ],
          empty: [],
        },
      ),
      withUnauthorizedResponses(),
      withNotFoundResponses(['PostNotFound']),
    ),
};
