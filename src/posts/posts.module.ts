import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { CommentsModule } from 'src/comments/comments.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [CommentsModule, S3Module],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
})
export class PostsModule {}
