import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies?.['refresh_token'] as string;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      username: payload.username,
    };
  }
}
