import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (
        err instanceof TokenExpiredError ||
        info?.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
      } else if (
        err instanceof JsonWebTokenError ||
        info?.name === 'JsonWebTokenError'
      ) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      } else {
        throw new UnauthorizedException('리프레시 토큰 인증에 실패했습니다.');
      }
    }
    return user;
  }
}
