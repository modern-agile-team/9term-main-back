import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RequestWithUser, getClientIp } from '../types/http';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithUser>();
    const res = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const maybeMsg = (resp as Record<string, unknown>)['message'];
        if (typeof maybeMsg === 'string') {
          message = maybeMsg;
        } else if (Array.isArray(maybeMsg) && typeof maybeMsg[0] === 'string') {
          message = maybeMsg[0];
        } else {
          const err = (resp as Record<string, unknown>)['error'];
          if (typeof err === 'string') {
            message = err;
          }
        }
      }
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error('HTTP Exception', {
      status,
      message,
      method: req.method,
      url: req.originalUrl ?? req.url,
      userId: req.user?.userId,
      requestId: req.requestId,
      ip: getClientIp(req),
      stack,
    });

    res.status(status).json({ statusCode: status, message });
  }
}
