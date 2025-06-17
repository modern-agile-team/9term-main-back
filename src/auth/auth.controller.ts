import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { JwtRefreshGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {
  private readonly COOKIE_OPTIONS = {
    httpOnly: process.env.COOKIE_HTTP_ONLY === 'true',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none',
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
  };

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupRequestDto: SignupRequestDto) {
    await this.authService.signup(signupRequestDto);
    return {
      status: 'success',
      message: '회원가입에 성공했습니다.',
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

    res.cookie('refresh_token', refreshToken, this.COOKIE_OPTIONS);

    return {
      status: 'success',
      message: '로그인에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      res.status(400);
      return {
        status: 'fail',
        message: 'Refresh Token이 없습니다.',
        data: null,
      };
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie('refresh_token', newRefreshToken, this.COOKIE_OPTIONS);

    return {
      status: 'success',
      message: 'Access Token 재발급에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }
}
