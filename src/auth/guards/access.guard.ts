import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AuthenticatedUserResponse } from '../interfaces/authenticated-user-response.interface';

@Injectable()
export class CustomJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any): any {
    if (err || !user) {
      if (
        err instanceof TokenExpiredError ||
        info?.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException(
          '토큰이 만료되었습니다. 다시 로그인해주세요.',
        );
      } else if (
        err instanceof JsonWebTokenError ||
        info?.name === 'JsonWebTokenError'
      ) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else {
        throw new UnauthorizedException('인증에 실패했습니다.');
      }
    }
    return user as AuthenticatedUserResponse;
  }
}
