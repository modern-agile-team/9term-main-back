import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const isProd = configService.get<string>('NODE_ENV') === 'production';

    const extractors = isProd
      ? [ExtractJwt.fromAuthHeaderAsBearerToken()]
      : [
          ExtractJwt.fromAuthHeaderAsBearerToken(),
          ExtractJwt.fromHeader('x-access-token'),
          ExtractJwt.fromUrlQueryParameter('token'),
        ];

    super({
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      secretOrKey:
        configService.get<string>('JWT_SECRET_KEY') || 'JWT_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    return { username: payload.username };
  }
}
