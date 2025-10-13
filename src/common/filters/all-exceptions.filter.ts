import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';

interface ContextRequest extends Request {
  __contextName?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: winston.Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<ContextRequest>();

    let status = Number(HttpStatus.INTERNAL_SERVER_ERROR);
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) ?? JSON.stringify(obj);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const contextName =
      req.__contextName ?? `${req.method} ${req.route?.path ?? req.url}`;
    const level =
      status >= 500
        ? 'error'
        : [401, 403, 409].includes(status)
          ? 'warn'
          : 'info';

    // 5xx만 스택 출력
    if (level === 'error' && exception instanceof Error) {
      this.logger.error(`${status} | ${message}`, exception.stack, contextName);
    } else if (level === 'warn') {
      this.logger.warn(`${status} | ${message}`, contextName);
    } else {
      this.logger.log(`${status} | ${message}`, contextName);
    }
    res.status(status).json({ statusCode: status, message });
  }
}
