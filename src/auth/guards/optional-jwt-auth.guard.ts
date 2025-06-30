import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: any,
    user: any,
    _info: any,
    _context: ExecutionContext,
  ): any {
    void _info;
    void _context;

    return user ?? null;
  }
}
