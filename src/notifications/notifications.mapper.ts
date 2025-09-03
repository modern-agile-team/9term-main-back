import { NotificationType } from '@prisma/client';
import { NotificationResponseDto } from './dto/notification.dto';

export function toNotificationResponseDto(entity: {
  isRead: boolean;
  notification: {
    id: number;
    type: NotificationType;
    message: string;
    senderId: number | null;
    groupId: number | null;
    createdAt: Date;
  };
}): NotificationResponseDto {
  const { notification, isRead } = entity;

  switch (notification.type) {
    case NotificationType.NEW_JOIN_REQUEST:
      return {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt,
        isRead,
        payload: { groupId: notification.groupId! },
      };
    default:
      throw new Error('지원하지 않는 알림 타입');
  }
}
