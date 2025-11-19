import { forwardRef, Module } from '@nestjs/common';
import { GroupsModule } from 'src/groups/groups.module';
import { MemberModule } from 'src/member/member.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => GroupsModule),
    forwardRef(() => MemberModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
