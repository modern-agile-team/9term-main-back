import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupRequestDto: SignupRequestDto) {
    const user = await this.authService.signup(signupRequestDto);

    return {
      status: 'success',
      message: '회원가입 성공',
      data: null,
    };
  }

  @Post('login')
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginRequestDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, // JS로 접근 불가
      secure: true, // HTTPS일 때만 전송
      sameSite: 'strict', // 크로스 도메인 전송 제한
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일동안 유지
    });
    return {
      status: 'success',
      message: '로그인 성공',
      data: { accessToken },
    };
  }
}
