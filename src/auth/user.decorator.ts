import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
