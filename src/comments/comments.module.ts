import { Module } from '@nestjs/common';
import { MemberModule } from 'src/member/member.module';
import { PostsModule } from 'src/posts/posts.module';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';

@Module({
  imports: [PostsModule, MemberModule],
  providers: [CommentsService, CommentsRepository],
  controllers: [CommentsController],
  exports: [CommentsRepository],
})
export class CommentsModule {}
