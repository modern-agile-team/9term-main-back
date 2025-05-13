import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './auth/user.controller';
import { PostsModule } from './posts/posts.module'; // ✅ 추가

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PostsModule, // ✅ 여기에 추가!
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
