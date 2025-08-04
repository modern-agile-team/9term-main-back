import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { MembersService } from '../member/member.service';
import { MemberModule } from '../member/member.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [MemberModule, S3Module],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository, MembersService],
})
export class GroupsModule {}
