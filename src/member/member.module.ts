import { Module } from '@nestjs/common';
import { MembersController } from './member.controller';
import { MembersService } from './member.service';
import { MemberRepository } from './member.repository';

@Module({
  controllers: [MembersController],
  providers: [MembersService, MemberRepository],
  exports: [MembersService, MemberRepository],
})
export class MemberModule {}
