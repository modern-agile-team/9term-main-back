import { Module } from '@nestjs/common';
import { MembersController } from './member.controller';
import { MembersService } from './member.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService],
})
export class MemberModule {}
