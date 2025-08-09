import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { SignupRequestDto } from './dto/requests/signup-request.dto';
import { AuthTokenDataDto } from './dto/responses/auth-response.dto';
import { LoginResponseDto } from './dto/responses/login-response.dto';

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

const conflictExamples = {
  DuplicateUser: {
    message: '이미 사용 중인 아이디입니다.',
    error: 'Conflict',
    statusCode: 409,
  },
} as const;

const badRequestExamples = {
  UsernamePattern: {
    message: [
      'username은 숫자만으로 구성될 수 없으며, 영문자와 숫자만 사용할 수 있습니다.',
    ],
    error: 'Bad Request',
    statusCode: 400,
  },
  NamePattern: {
    message: ['이름은 2자 이상 30자 이하로 입력해주세요.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  PasswordPattern: {
    message: ['비밀번호는 8자 이상이어야 합니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
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
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: description },
              data: { $ref: getSchemaPath(model) },
            },
          },
        },
      },
    }),
  );
};

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
        schema: {
          properties: {
            status: { type: 'string', example: 'success' },
            message: { type: 'string', example: '회원가입에 성공했습니다.' },
            data: { type: 'string', example: null, nullable: true },
          },
        },
      }),
      conflictResponses(),
      badRequestResponses([
        'UsernamePattern',
        'NamePattern',
        'PasswordPattern',
        'FieldRequired',
      ]),
    ),

  login: () =>
    applyDecorators(
      ApiOperation({ summary: '로그인' }),
      ApiBody({ description: '로그인 요청 DTO', type: LoginRequestDto }),
      ApiResponseWithData(LoginResponseDto, 201, '로그인에 성공했습니다.'),
      badRequestResponses(['LoginFail', 'FieldRequired', 'UserNotFound']),
      unauthorizedResponses(),
    ),

  refresh: () =>
    applyDecorators(
      ApiOperation({ summary: '토큰 리프레시' }),
      ApiResponseWithData(AuthTokenDataDto, 201, '토큰 재발급 성공'),
      badRequestResponses(['RefreshToken', 'InvalidRefreshToken']),
      unauthorizedResponses(),
    ),
};
