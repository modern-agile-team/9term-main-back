import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { S3Module } from 'src/s3/s3.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserDeletionService } from './user-deletion.service';
import { UserDeletionListener } from './user-deletion.listener';

@Module({
  imports: [S3Module, EventEmitterModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UserDeletionService,
    UserDeletionListener,
  ],
  exports: [UsersService],
})
export class UsersModule {}
