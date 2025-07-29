import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserController } from './auth/user.controller';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { MemberModule } from './member/member.module';
import { GroupsModule } from './groups/groups.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PostsModule,
    MemberModule,
    CommentsModule,
    S3Module,
    GroupsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
