import { Module } from '@nestjs/common';
import { PostsRepository } from 'src/posts/posts.repository';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [],
  providers: [CommentsService, CommentsRepository, PostsRepository],
  controllers: [CommentsController],
  exports: [CommentsRepository],
})
export class CommentsModule {}
