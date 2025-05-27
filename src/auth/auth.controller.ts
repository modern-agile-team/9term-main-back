import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import {
  ApiTags,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiBody({
    description: '회원가입 요청 DTO',
    examples: {
      valid_request: {
        summary: '정상 입력 예시',
        value: {
          userName: 'test123',
          name: '정윤호',
          password: '12345678',
        },
      },
      invalid_username_numeric: {
        summary: '아이디가 숫자만일 경우',
        value: {
          userName: '1234',
          name: '정윤호',
          password: '12345678',
        },
      },
      invalid_username_short: {
        summary: '아이디가 너무 짧을 경우',
        value: {
          userName: 'ab',
          name: '정윤호',
          password: '12345678',
        },
      },
      invalid_name_too_short: {
        summary: '이름이 1자일 경우',
        value: {
          userName: 'test123',
          name: '정',
          password: '12345678',
        },
      },
      invalid_name_too_long: {
        summary: '이름이 30자를 초과할 경우',
        value: {
          userName: 'test123',
          name: '정윤호정윤호정윤호정윤호정윤호정윤호정윤호',
          password: '12345678',
        },
      },
      invalid_password_short: {
        summary: '비밀번호가 8자 미만일 경우',
        value: {
          userName: 'test123',
          name: '정윤호',
          password: '1234',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: '회원가입 성공',
    schema: {
      example: {
        status: 'success',
        message: '회원가입에 성공했습니다.',
        data: null,
      },
    },
  })
  async signup(@Body() signupRequestDto: SignupRequestDto) {
    await this.authService.signup(signupRequestDto);
    return {
      status: 'success',
      message: '회원가입에 성공했습니다.',
      data: null,
    };
  }

  @Post('login')
  @ApiBody({
    description: '로그인 요청 DTO',
    examples: {
      valid_request: {
        summary: '정상 입력 예시',
        value: {
          userName: 'test123',
          password: '12345678',
        },
      },
      invalid_login_wrong_credentials: {
        summary: '아이디 또는 비밀번호 틀림',
        value: {
          userName: 'wrongUser',
          password: 'wrongPassword',
        },
      },
    },
  })
  @ApiCreatedResponse({
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
  })
  @ApiBadRequestResponse({
    description: '로그인 실패',
    schema: {
      example: {
        message: '아이디 또는 비밀번호가 틀렸습니다.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginRequestDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      status: 'success',
      message: '로그인에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }
}
