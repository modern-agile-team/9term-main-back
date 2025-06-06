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
  ApiOperation,
} from '@nestjs/swagger';

import { signupSwagger, loginSwagger } from './auth.swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
