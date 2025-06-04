import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';

export const signupSwagger = {
  apiBody: {
    description: '회원가입 요청 DTO',
    type: SignupRequestDto,
  },
  apiCreatedResponse: {
    description: '회원가입 성공',
    schema: {
      example: {
        status: 'success',
        message: '회원가입에 성공했습니다.',
        data: null,
      },
    },
  },
  apiBadRequestResponse: {
    description: '회원가입 실패',
    schema: {
      example: {
        message: '이미 사용 중인 사용자 ID입니다.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  },
};

export const loginSwagger = {
  apiBody: {
    description: '로그인 요청 DTO',
    type: LoginRequestDto,
  },
  apiCreatedResponse: {
    description: '로그인 성공',
    schema: {
      example: {
        status: 'success',
        message: '로그인에 성공했습니다.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...',
        },
      },
    },
  },
  apiBadRequestResponse: {
    description: '로그인 실패',
    schema: {
      example: {
        message: '아이디 또는 비밀번호가 틀렸습니다.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  },
};
