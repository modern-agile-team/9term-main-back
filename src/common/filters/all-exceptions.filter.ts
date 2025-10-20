import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

interface ContextRequest extends Request {
  __contextName?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<ContextRequest>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 오류 발생';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const obj = exceptionResponse as Record<string, unknown>;
        message = (obj.message as string) ?? JSON.stringify(obj);
        error = (obj.error as string) ?? JSON.stringify(obj);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const context = req.__contextName ?? `${req.route?.path ?? req.url}`;
    const stack = (exception as Error)?.stack;

    const level =
      status >= 500
        ? 'error'
        : [401, 403, 409].includes(status)
          ? 'warn'
          : 'info';

    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      message: `${status} | ${message}`,
      path: req.url,
      method: req.method,
      context,
      stack,
    };

    this.logger.log(logPayload);

    const responseBody = {
      message,
      error,
      statusCode: status,
    };

    res.status(status).json(responseBody);
  }
}
