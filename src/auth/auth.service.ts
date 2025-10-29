import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OAuthInput } from './interfaces/oauth.interface';
import { OAuthService } from './oauth.service';
import { PasswordEncoderService } from './password-encoder.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordEncoderService: PasswordEncoderService,
    private readonly oauthService: OAuthService,
  ) {}

  // 로그인
  async login(loginRequestDto: LoginRequestDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.usersService.getUserByUsername(
      loginRequestDto.username,
    );
    if (!user) {
      throw new BadRequestException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    if (!user.password) {
      throw new BadRequestException('비밀번호가 설정되지 않은 계정입니다.');
    }
    const isMatch = await this.passwordEncoderService.compare(
      loginRequestDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    return this.issueTokens(user);
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findUserById(payload.sub);
      if (!user) {
        throw new BadRequestException('유효하지 않은 사용자입니다.');
      }
      return this.issueTokens(user);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(`에러 발생: ${e.message}`, e.stack);
      }
      throw new InternalServerErrorException();
    }
  }

  async oauthLogin(params: OAuthInput): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.oauthService.resolveUser(params);
    return this.issueTokens(user);
  }

  private issueTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      name: user.name,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshPayload = { sub: user.id };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
    return { accessToken, refreshToken };
  }
}
