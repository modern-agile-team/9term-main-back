import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  Notification as PrismaNotification,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createJoinRequestNoti(
    senderId: number,
    groupId: number,
    message: string,
    managerIds: number[],
  ): Promise<PrismaNotification> {
    return this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_JOIN_REQUEST,
        senderId,
        groupId,
        message,
        recipients: {
          create: managerIds.map((userId) => ({ userId })),
        },
      },
    });
  }

  async createPostNoti(
    senderId: number,
    groupId: number,
    postId: number,
    message: string,
    recipientIds: number[],
  ): Promise<PrismaNotification> {
    return this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_POST_IN_GROUP,
        senderId,
        groupId,
        postId,
        message,
        recipients: {
          create: recipientIds.map((userId) => ({ userId })),
        },
      },
    });
  }

  // 특정 유저의 특정 알림 조회
  async findUserNotification(notificationId: number, userId: number) {
    return this.prisma.userNotification.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });
  }

  // 특정 유저의 모든 알림 가져오기
  async getNotificationsByUserId(userId: number): Promise<
    {
      isRead: boolean;
      notification: {
        id: number;
        type: NotificationType;
        message: string;
        senderId: number | null;
        groupId: number | null;
        postId: number | null;
        createdAt: Date;
      };
    }[]
  > {
    return this.prisma.userNotification.findMany({
      where: { userId },
      orderBy: { receivedAt: 'desc' },
      select: {
        isRead: true,
        notification: {
          select: {
            id: true,
            type: true,
            message: true,
            senderId: true,
            groupId: true,
            postId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.prisma.userNotification.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteUserNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.prisma.userNotification.delete({
      where: { notificationId_userId: { notificationId, userId } },
    });
  }
}
