import { Module } from '@nestjs/common';
import { GroupsModule } from 'src/groups/groups.module';
import { PostsModule } from 'src/posts/posts.module';
import { PostLikesController } from './post-likes.controller';
import { PostLikesRepository } from './post-likes.repository';
import { PostLikesService } from './post-likes.service';

@Module({
  imports: [GroupsModule, PostsModule],
  controllers: [PostLikesController],
  providers: [PostLikesRepository, PostLikesService],
})
export class PostLikesModule {}
