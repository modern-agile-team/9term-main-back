import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { MembersController } from './member.controller';
import { MemberRepository } from './member.repository';
import { MembersService } from './member.service';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => GroupsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [MembersController],
  providers: [MembersService, MemberRepository],
  exports: [MembersService, MemberRepository],
})
export class MemberModule {}
