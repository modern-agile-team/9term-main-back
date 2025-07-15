import { Module } from '@nestjs/common';
import { CommentsModule } from 'src/comments/comments.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [CommentsModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
