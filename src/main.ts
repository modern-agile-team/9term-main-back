import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpStatusLoggingInterceptor } from './common/interceptors/http-status-logging.interceptor';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { RequestWithUser } from './common/types/http';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const typeReq = req as RequestWithUser;
    const headerVal = req.headers['x-request-id'];
    const fromClient = typeof headerVal === 'string' ? headerVal : undefined;

    const requestId =
      fromClient && fromClient.length > 0 ? fromClient : randomUUID();
    typeReq.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      stopAtFirstError: true,
    }),
  );

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER)),
  );

  app.useGlobalInterceptors(
    new HttpStatusLoggingInterceptor(app.get(WINSTON_MODULE_NEST_PROVIDER)),
  );

  const reflector = app.get<Reflector>(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  app.use(cookieParser());

  app.set('trust proxy', true);

  const corsOriginsString = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOriginsString
    ? corsOriginsString
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('모동구')
    .setDescription('모동구 API 명세서')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT 토큰을 입력하세요.',
        in: 'header',
      },
      'access-token',
    )
    .setTermsOfService('https://github.com/modern-agile-team/9term-main-back')
    .addTag('모동구')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
