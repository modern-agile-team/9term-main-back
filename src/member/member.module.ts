import { Module, forwardRef } from '@nestjs/common';
import { MembersController } from './member.controller';
import { MembersService } from './member.service';
import { MemberRepository } from './member.repository';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [forwardRef(() => GroupsModule)],
  controllers: [MembersController],
  providers: [MembersService, MemberRepository],
  exports: [MembersService, MemberRepository],
})
export class MemberModule {}
