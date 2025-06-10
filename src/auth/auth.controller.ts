import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import {
  ApiTags,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOperation,
  ApiUnauthorizedResponse, // 추가
} from '@nestjs/swagger';

import { signupSwagger, loginSwagger } from './auth.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions = {
    httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
  };
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  @ApiBody(signupSwagger.apiBody)
  @ApiOperation({ summary: '회원가입' })
  @ApiCreatedResponse(signupSwagger.apiCreatedResponse)
  @ApiBadRequestResponse(signupSwagger.apiBadRequestResponse)
  async signup(@Body() signupRequestDto: SignupRequestDto) {
    await this.authService.signup(signupRequestDto);
    return {
      status: 'success',
      message: '회원가입에 성공했습니다.',
      data: null,
    };
  }

  @Post('login')
  @ApiBody(loginSwagger.apiBody)
  @ApiOperation({ summary: '로그인' })
  @ApiCreatedResponse(loginSwagger.apiCreatedResponse)
  @ApiBadRequestResponse(loginSwagger.apiBadRequestResponse)
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginRequestDto);

    res.cookie('refresh_token', refreshToken, this.cookieOptions);

    return {
      status: 'success',
      message: '로그인에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Access Token 재발급' })
  @ApiCreatedResponse({
    description: 'Access Token 재발급 성공',
    schema: {
      example: {
        status: 'success',
        message: 'Access Token 재발급에 성공했습니다.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Refresh Token이 없거나 유효하지 않음',
    schema: {
      example: {
        statusCode: 400,
        message: 'Refresh Token이 없습니다.',
        error: 'Bad Request',
      },
    },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      res.status(400);
      return {
        statusCode: 400,
        message: 'Refresh Token이 없습니다.',
        error: 'Bad Request',
      };
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);
    res.cookie('refresh_token', newRefreshToken, this.cookieOptions);

    return {
      status: 'success',
      message: 'Access Token 재발급에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }
}
