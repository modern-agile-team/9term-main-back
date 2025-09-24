import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { OAuthInput } from './interfaces/oauth.interface';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/users.repository';
import { OAuthService } from './oauth.service';
import { LoginRequestDto } from './dto/requests/login-request.dto';
import { SocialSignupRequestDto } from './dto/requests/social-signup-request.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordEncoderService } from './password-encoder.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
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
    canSetCredentials: boolean;
    provider?: string;
    providerId?: string;
  }> {
    const user = await this.oauthService.resolveUser(params);
    if (!user) {
      throw new InternalServerErrorException('OAuth 처리 실패');
    }
    const tokens = this.issueTokens(user);
    const canSet = !user.password;
    return {
      ...tokens,
      canSetCredentials: canSet,
      provider: canSet ? params.provider : undefined,
      providerId: canSet ? params.providerId : undefined,
    };
  }

  async socialSignupFinalize(
    dto: SocialSignupRequestDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { provider, providerId, username, password, name } = dto;

    const existing = await this.usersService.getUserByUsername(username);
    if (existing) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }

    const account = await this.usersRepository.findOAuthAccount(
      provider,
      providerId,
    );
    if (!account) {
      throw new BadRequestException('유효하지 않은 소셜 계정입니다.');
    }

    const user = await this.usersRepository.findUserById(account.userId);
    if (!user) {
      throw new InternalServerErrorException('사용자 정보를 찾을 수 없습니다.');
    }

    if (user.password) {
      throw new BadRequestException('이미 사용자 비밀번호가 설정되었습니다.');
    }

    const hashed = await this.passwordEncoderService.hash(password);

    const updated = await this.usersRepository.updateUser(user.id, {
      username,
      name: name ?? user.name,
      password: hashed,
    });

    return this.issueTokens(updated);
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
      secret: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
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
