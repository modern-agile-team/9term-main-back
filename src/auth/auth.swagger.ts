import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginRequestDto } from './dto/login-request.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

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

const conflictExamples = {
  DuplicateUser: {
    message: '이미 사용 중인 사용자 ID입니다.',
    error: 'Conflict',
    statusCode: 409,
  },
};

const badRequestExamples = {
  PasswordPattern: {
    message: ['비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  EmailPattern: {
    message: ['이메일 형식이 올바르지 않습니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  Required: {
    message: ['필수 값이 누락되었거나 형식이 올바르지 않습니다.'],
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
};

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

const conflictResponses = () =>
  ApiResponse({
    status: 409,
    description: '중복된 리소스',
    content: {
      'application/json': {
        examples: {
          '중복 사용자': { value: conflictExamples.DuplicateUser },
        },
      },
    },
  });

const badRequestResponses = (examples: Record<string, object>) =>
  ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    content: {
      'application/json': {
        examples: Object.entries(examples).reduce(
          (acc, [name, exValue]) => {
            acc[name] = { value: exValue };
            return acc;
          },
          {} as Record<string, { value: object }>,
        ),
      },
    },
  });

export function AuthSwagger() {
  return applyDecorators(ApiTags('Auth'));
}

export const ApiAuth = {
  signup: () =>
    applyDecorators(
      ApiOperation({ summary: '회원가입' }),
      ApiBody({ description: '회원가입 요청 DTO', type: SignupRequestDto }),
      ApiResponse({
        status: 201,
        description: '회원가입 성공',
        type: AuthResponseDto,
      }),
      conflictResponses(),
      badRequestResponses({
        '비밀번호 패턴 불일치': badRequestExamples.PasswordPattern,
        '이메일 패턴 불일치': badRequestExamples.EmailPattern,
        '필수값 누락/형식 오류': badRequestExamples.Required,
        '존재하지 않는 사용자': badRequestExamples.UserNotFound,
      }),
      unauthorizedResponses(),
    ),

  login: () =>
    applyDecorators(
      ApiOperation({ summary: '로그인' }),
      ApiBody({ description: '로그인 요청 DTO', type: LoginRequestDto }),
      ApiResponse({
        status: 201,
        description: '로그인 성공',
        type: AuthResponseDto,
      }),
      badRequestResponses({
        '로그인 실패': badRequestExamples.LoginFail,
        '필수값 누락/형식 오류': badRequestExamples.Required,
        '존재하지 않는 사용자': badRequestExamples.UserNotFound,
      }),
      unauthorizedResponses(),
    ),

  refresh: () =>
    applyDecorators(
      ApiOperation({ summary: '토큰 리프레시' }),
      ApiResponse({
        status: 201,
        description: '토큰 재발급 성공',
        type: AuthResponseDto,
      }),
      badRequestResponses({
        'Refresh Token 없음': badRequestExamples.RefreshToken,
        '유효하지 않은 Refresh Token': badRequestExamples.InvalidRefreshToken,
      }),
      unauthorizedResponses(),
    ),
};
