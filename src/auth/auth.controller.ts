import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { AuthService } from './auth.service';
import { ApiAuth, AuthSwagger } from './auth.swagger';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { SignupRequestDto } from './dto/requests/signup-request.dto';
import { AuthTokenDataDto } from './dto/responses/auth-response.dto';
import { JwtRefreshGuard } from './guards/refresh.guard';

@Controller('auth')
@AuthSwagger()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions() {
    return {
      httpOnly: this.configService.get('COOKIE_HTTP_ONLY') === 'true',
      secure: this.configService.get('COOKIE_SECURE') === 'true',
      sameSite: this.configService.get('COOKIE_SAME_SITE') as
        | 'strict'
        | 'lax'
        | 'none',
      maxAge:
        Number(this.configService.get('COOKIE_MAX_AGE')) ||
        7 * 24 * 60 * 60 * 1000,
    };
  }

  @Post('signup')
  @ApiAuth.signup()
  async signup(
    @Body() signupRequestDto: SignupRequestDto,
  ): Promise<ApiResponseDto<AuthTokenDataDto>> {
    await this.authService.signup(signupRequestDto);
    return {
      status: 'success',
      message: '회원가입에 성공했습니다.',
      data: null,
    };
  }

  @Post('login')
  @ApiAuth.login()
  async login(
    @Body() loginRequestDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto<AuthTokenDataDto>> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginRequestDto);

    res.cookie('refresh_token', refreshToken, this.getCookieOptions());

    return {
      status: 'success',
      message: '로그인에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }

  @UseGuards(JwtRefreshGuard)
  @ApiAuth.refresh()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponseDto<AuthTokenDataDto>> {
    const refreshToken = req.cookies['refresh_token'] as string;
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

    res.cookie('refresh_token', newRefreshToken, this.getCookieOptions());

    return {
      status: 'success',
      message: 'Access Token 재발급에 성공했습니다.',
      data: {
        accessToken,
      },
    };
  }
}
