import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface'; // 인증된 사용자 인터페이스를 가져온다.
import { JwtPayload } from './interfaces/jwt-payload.interface'; // JWT 페이로드 인터페이스를 가져온다.

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

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      username: payload.username,
      name: payload.name,
    }; // payload는 JWT 토큰의 페이로드 부분이다.
  }
}
