import { NotificationType } from '@prisma/client';

type BaseNotification = {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

type NotificationPayloadMap = {
  [NotificationType.NEW_JOIN_REQUEST]: { groupId: number };
  [NotificationType.NEW_POST_IN_GROUP]: { groupId: number; postId: number };
};

export type NotificationResponseDto = {
  [k in keyof NotificationPayloadMap]: BaseNotification & {
    payload: NotificationPayloadMap[k];
  };
}[keyof NotificationPayloadMap];
