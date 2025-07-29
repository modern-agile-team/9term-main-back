import { Module } from '@nestjs/common';
import { PostLikesController } from './postlikes.controller';
import { PostLikesRepository } from './postlikes.repository';
import { PostLikesService } from './postlikes.service';

@Module({
  controllers: [PostLikesController],
  providers: [PostLikesRepository, PostLikesService],
})
export class PostLikesModule {}
