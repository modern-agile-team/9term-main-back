import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // 회원가입
  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
    });

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 사용자 이름입니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        userName: dto.userName,
        name: dto.name,
        password: hashedPassword,
      },
    });

    return user;
  }

  // 로그인
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
    });

    if (!user) {
      throw new BadRequestException('이메일 또는 비밀번호가 틀렸습니다.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new BadRequestException('이메일 또는 비밀번호가 틀렸습니다.');
    }

    const token = jwt.sign({ username: user.userName }, 'JWT_SECRET_KEY', {
      expiresIn: '7d',
    });

    return {
      token,
    };
  }
}
