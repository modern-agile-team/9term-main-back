import { NotificationType } from '@prisma/client';

export class JoinRequestResponseDto {
  id: number;
  type: NotificationType = NotificationType.NEW_JOIN_REQUEST;
  senderId: number;
  senderName: string;
  groupId: number;
  groupName: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}
