import { Injectable } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createJoinRequest(
    senderId: number,
    groupId: number,
    message: string,
    managerIds: number[],
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        type: NotificationType.NEW_JOIN_REQUEST,
        senderId,
        groupId,
        message,
        recipients: { create: managerIds.map((userId) => ({ userId })) },
      },
    });

    return {
      isRead: false,
      notification,
    };
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
  async getUserNotifications(userId: number): Promise<
    {
      isRead: boolean;
      notification: {
        id: number;
        type: NotificationType;
        message: string;
        senderId: number | null;
        groupId: number | null;
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
            createdAt: true,
          },
        },
      },
    });
  }

  async markAsRead(notificationId: number, userId: number) {
    await this.prisma.userNotification.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteUserNotification(notificationId: number, userId: number) {
    await this.prisma.userNotification.delete({
      where: { notificationId_userId: { notificationId, userId } },
    });
  }

  async findJoinRequest(
    groupId: number,
    senderId: number,
  ): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: {
        type: NotificationType.NEW_JOIN_REQUEST,
        groupId,
        senderId,
      },
    });
  }
}
