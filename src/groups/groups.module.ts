import { Module } from '@nestjs/common';
import { MemberModule } from '../member/member.module';
import { MembersService } from '../member/member.service';
import { GroupsController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

@Module({
  imports: [MemberModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsRepository, MembersService],
  exports: [GroupsRepository],
})
export class GroupsModule {}
