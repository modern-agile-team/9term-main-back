import { Module, forwardRef } from '@nestjs/common';
import { MemberModule } from 'src/member/member.module';
import { S3Module } from 'src/s3/s3.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserDeletionService } from './user-deletion.service';

@Module({
  imports: [S3Module, forwardRef(() => MemberModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UserDeletionService],
  exports: [UsersService],
})
export class UsersModule {}
