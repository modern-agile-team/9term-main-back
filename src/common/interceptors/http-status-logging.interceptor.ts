import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Observable, tap } from 'rxjs';
import { RequestWithUser } from '../types/http';

@Injectable()
export class HttpStatusLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<RequestWithUser>();
    const res = http.getResponse<{ statusCode: number }>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const status = res.statusCode;
          if (status >= 400) {
            const durationMs = Number(
              (process.hrtime.bigint() - start) / BigInt(1e6),
            );

            this.logger.warn('HTTP Non-2xx', {
              status,
              method: req.method,
              url: req.originalUrl ?? req.url,
              userId: req.user?.userId,
              requestId: req.requestId,
              durationMs,
            });
          }
        },
      }),
    );
  }
}
