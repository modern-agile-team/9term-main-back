import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 에러가 나거나 user가 없으면 그냥 null로 처리 (로그인 안 한 상태)
    return user ?? null;
  }
}
