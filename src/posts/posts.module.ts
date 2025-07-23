import { Module } from '@nestjs/common';
import { S3Module } from 'src/s3/s3.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [S3Module],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
