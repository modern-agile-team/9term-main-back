import { InternalServerErrorException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationResponseDto } from './types/notification-response.type';

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
      throw new InternalServerErrorException(
        `지원하지 않는 알림 타입: ${notification.type as string}`,
      );
  }
}

export function toFallbackNotification(entity: {
  isRead: boolean;
  notification: {
    id: number;
    type: NotificationType;
    message: string;
    createdAt: Date;
  };
}): NotificationResponseDto {
  return {
    id: entity.notification.id,
    type: entity.notification.type,
    message: entity.notification.message,
    createdAt: entity.notification.createdAt,
    isRead: entity.isRead,
    payload: null,
  };
}
