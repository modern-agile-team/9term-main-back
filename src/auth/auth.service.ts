import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordEncoderService } from 'src/auth/password-encoder.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordEncoderService: PasswordEncoderService,
  ) {}

  // 회원가입
  async signup(signupRequestDto: SignupRequestDto) {
    const existingUser = await this.userRepository.findByUserName(
      signupRequestDto.userName,
    );

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 사용자 이름입니다.');
    }

    const hashedPassword = await this.passwordEncoderService.hash(
      signupRequestDto.password,
    );

    const user = await this.userRepository.createUser({
      userName: signupRequestDto.userName,
      name: signupRequestDto.name,
      password: hashedPassword,
    });

    return user;
  }

  // 로그인
  async login(loginRequestDto: LoginRequestDto) {
    const user = await this.userRepository.findByUserName(
      loginRequestDto.userName,
    );

    if (!user) {
      throw new BadRequestException('이메일 또는 비밀번호가 틀렸습니다.');
    }

    const isMatch = await bcrypt.compare(
      loginRequestDto.password,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException('아이디 또는 비밀번호가 틀렸습니다.');
    }

    const payload = { username: user.userName };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
