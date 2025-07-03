import { Module } from '@nestjs/common';
import { MembersController } from './member.controller';
import { MembersService } from './member.service';
import { MemberRepository } from './member.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, MemberRepository, PrismaService],
  exports: [MembersService, MemberRepository],
})
export class MemberModule {}
