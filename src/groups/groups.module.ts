import { Module, forwardRef } from '@nestjs/common';
import { S3Module } from 'src/s3/s3.module';
import { MemberModule } from '../member/member.module';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

@Module({
  imports: [forwardRef(() => MemberModule), S3Module],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository],
  exports: [GroupsRepository],
})
export class GroupsModule {}
