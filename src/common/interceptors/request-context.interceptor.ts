import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const contextName = `${controller}.${handler}`;

    const request = context.switchToHttp().getRequest<Request>();
    request['__contextName'] = contextName; // Filter에서 사용할 컨텍스트 저장

    return next.handle().pipe();
  }
}
