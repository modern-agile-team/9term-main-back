import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    // super는 부모 클래스의 생성자를 호출하는 메서드이다.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 요청 헤더에서 Bearer 토큰을 추출하는 메서드이다.
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET_KEY'), // env 파일에 있는 값을 가져온다.
      // getOrThrow은 해당 키가 없으면 에러를 던진다.
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      userName: payload.userName,
      name: payload.name,
    };
  }
}
