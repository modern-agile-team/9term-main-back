import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginRequestDto } from './dto/requests/login-request.dto';

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
} as const;

const badRequestExamples = {
  FieldRequired: {
    message: ['필수 값이 누락되었거나 빈 문자열입니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  LoginFail: {
    message: ['아이디 또는 비밀번호가 틀렸습니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  RefreshToken: {
    message: ['Refresh Token이 없습니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  UserNotFound: {
    message: ['존재하지 않는 사용자입니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  InvalidRefreshToken: {
    message: ['유효하지 않은 Refresh Token입니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
} as const;

const unauthorizedResponses = () =>
  ApiResponse({
    status: 401,
    description: '인증되지 않음 (JWT 토큰 없음, 만료, 유효하지 않음)',
    content: {
      'application/json': {
        examples: {
          '토큰 만료': { value: unauthorizedExamples.TokenExpired },
          '유효하지 않은 토큰': { value: unauthorizedExamples.InvalidToken },
        },
      },
    },
  });

const badRequestResponses = (keys: (keyof typeof badRequestExamples)[]) =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        examples: keys.reduce(
          (acc, key) => {
            acc[key] = { value: badRequestExamples[key] };
            return acc;
          },
          {} as Record<string, { value: object }>,
        ),
      },
    },
  });

export const ApiAuth = {
  okResponseWithData: (
    description: string,
    dataProperties: Record<string, any>,
  ) =>
    ApiResponse({
      status: 200,
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: description },
              data: { type: 'object', properties: dataProperties },
            },
          },
        },
      },
    }),

  login: () =>
    applyDecorators(
      ApiOperation({ summary: '로그인' }),
      ApiBody({ description: '로그인 요청 DTO', type: LoginRequestDto }),
      ApiAuth.okResponseWithData('로그인에 성공했습니다.', {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.loginAccessToken',
        },
      }),
      badRequestResponses(['LoginFail', 'FieldRequired', 'UserNotFound']),
      unauthorizedResponses(),
    ),

  refresh: () =>
    applyDecorators(
      ApiOperation({ summary: '토큰 리프레시' }),
      ApiAuth.okResponseWithData('Access Token 재발급에 성공했습니다.', {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshedAccessToken',
        },
      }),
      badRequestResponses(['RefreshToken', 'InvalidRefreshToken']),
      unauthorizedResponses(),
    ),

  googleCallback: () =>
    applyDecorators(
      ApiOperation({ summary: '구글 OAuth 콜백' }),
      ApiAuth.okResponseWithData('구글 로그인에 성공했습니다.', {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.googleAccessToken',
        },
        provider: { type: 'string', example: 'GOOGLE', nullable: true },
        providerId: {
          type: 'string',
          example: '123456789012345678901',
          nullable: true,
        },
      }),
    ),

  kakaoCallback: () =>
    applyDecorators(
      ApiOperation({ summary: '카카오 OAuth 콜백' }),
      ApiAuth.okResponseWithData('카카오 로그인에 성공했습니다.', {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.kakaoAccessToken',
        },
        provider: { type: 'string', example: 'KAKAO', nullable: true },
        providerId: {
          type: 'string',
          example: '987654321098765432101',
          nullable: true,
        },
      }),
    ),
};
