import { BadRequestException, Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions/internal-server-error.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginRequestDto } from './dto/login-request.dto';
import { SignupRequestDto } from './dto/signup-request.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PasswordEncoderService } from './password-encoder.service';
import { UserRepository } from './user.repository';

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
    const payload: JwtPayload = {
      sub: user.id,
      userName: user.userName,
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

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepository.findByUserName(payload.userName);
      if (!user) {
        throw new BadRequestException('유효하지 않은 사용자입니다.');
      }
      const newAccessPayload = {
        sub: user.id,
        userName: user.userName,
        name: user.name,
      };
      const accessToken = this.jwtService.sign(newAccessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET_KEY'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ),
      });
      const newRefreshPayload = { sub: user.id };
      const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ),
      });
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log(`에러 발생: ${e.message}`, e.stack);
      }
      throw new InternalServerErrorException();
    }
  }
}
