import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { MembersService } from '../member/member.service';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [MemberModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository, MembersService],
})
export class GroupsModule {}
