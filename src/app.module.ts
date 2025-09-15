import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { GroupsModule } from './groups/groups.module';
import { PostLikesModule } from './likes/post-likes.module';
import { MemberModule } from './member/member.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    S3Module,

    AuthModule,

    UsersModule,
    PostsModule,
    CommentsModule,
    GroupsModule,

    MemberModule,
    PostLikesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
