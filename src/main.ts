import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: ['https://localhost:3001', 'https://192.168.56.1:3001','https://www.modonggu.site'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS', 
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('모동구')
    .setDescription('모동구 API 명세서')
    .setVersion('1.0')
    .setTermsOfService('https://github.com/modern-agile-team/9term-main-back')
    .addTag('모동구')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
