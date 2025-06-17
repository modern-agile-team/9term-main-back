import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { UserRepository } from './user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordEncoderService } from './password-encoder.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordEncoderService: PasswordEncoderService,
  ) {}

  // 회원가입
  async signup(signupRequestDto: SignupRequestDto): Promise<void> {
    const existingUser = await this.userRepository.findByUserName(
      signupRequestDto.userName,
    );
    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }
    const hashedPassword = await this.passwordEncoderService.hash(
      signupRequestDto.password,
    );
    await this.userRepository.createUser({
      userName: signupRequestDto.userName,
      name: signupRequestDto.name,
      password: hashedPassword,
    });
  }

  // 로그인
  async login(loginRequestDto: LoginRequestDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.findByUserName(
      loginRequestDto.userName,
    );
    if (!user) {
      throw new BadRequestException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    const isMatch = await this.passwordEncoderService.compare(
      loginRequestDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    const payload = { sub: user.id, username: user.userName, name: user.name };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ),
    });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const newPayload = {
        sub: payload.sub,
        username: payload.username,
        name: payload.name,
      };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ),
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
      });
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new BadRequestException('유효하지 않은 Refresh Token입니다.');
    }
  }
}
