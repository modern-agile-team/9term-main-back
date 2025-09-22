import { Module, forwardRef } from '@nestjs/common';
import { GroupsModule } from 'src/groups/groups.module';
import { PostLikesModule } from 'src/likes/post-likes.module';
import { MemberModule } from 'src/member/member.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { S3Module } from 'src/s3/s3.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [
    S3Module,
    forwardRef(() => PostLikesModule),
    MemberModule,
    GroupsModule,
    NotificationsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
