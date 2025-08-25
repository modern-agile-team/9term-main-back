import { Module, forwardRef } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';
import { S3Module } from 'src/s3/s3.module';
import { PostLikesModule } from 'src/likes/post-likes.module';
import { MemberModule } from 'src/member/member.module';

@Module({
  imports: [S3Module, forwardRef(() => PostLikesModule), MemberModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
