import { Module, forwardRef } from '@nestjs/common';
import { GroupsModule } from 'src/groups/groups.module';
import { PostsModule } from 'src/posts/posts.module';
import { PostLikesController } from './post-likes.controller';
import { PostLikesRepository } from './post-likes.repository';
import { PostLikesService } from './post-likes.service';

@Module({
  imports: [GroupsModule, forwardRef(() => PostsModule)],
  controllers: [PostLikesController],
  providers: [PostLikesRepository, PostLikesService],
  exports: [PostLikesRepository],
})
export class PostLikesModule {}
