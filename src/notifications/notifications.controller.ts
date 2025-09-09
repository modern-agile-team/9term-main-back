import {
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Patch,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUserResponse } from 'src/auth/interfaces/authenticated-user-response.interface';
import { User } from 'src/auth/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './types/notification-response.type';

@Controller('notifications')
@UseGuards(CustomJwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  sse(@User() user: AuthenticatedUserResponse): Observable<MessageEvent> {
    return this.notificationsService
      .subscribeToUser(user.userId)
      .pipe(map((signal) => ({ type: 'NEW_NOTIFICATION', data: signal })));
  }

  // 모든 알림 가져오기
  @Get()
  async getNotifications(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<NotificationResponseDto[]>> {
    const data = await this.notificationsService.getNotificationsByUserId(
      user.userId,
    );
    return {
      status: 'success',
      message: '알림 목록을 성공적으로 가져왔습니다.',
      data,
    };
  }

  // 특정 알림 읽음 표시
  @Patch(':notificationId/read')
  async markAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<{ isRead: boolean }>> {
    await this.notificationsService.markAsRead(notificationId, user.userId);
    return {
      status: 'success',
      message: `알림이 성공적으로 읽음 처리되었습니다.`,
      data: { isRead: true },
    };
  }

  // 모든 알림 읽음 표시
  @Patch('read-all')
  async markAllRead(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<{ isRead: boolean }>> {
    await this.notificationsService.clearNotifications(user.userId);
    return {
      status: 'success',
      message: `모든 알림이 성공적으로 읽음 처리되었습니다.`,
      data: { isRead: true },
    };
  }

  @Delete(':notificationId')
  async deleteNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto> {
    await this.notificationsService.deleteNotification(
      notificationId,
      user.userId,
    );
    return {
      status: 'success',
      message: `알림이 성공적으로 삭제되었습니다.`,
      data: null,
    };
  }
}
