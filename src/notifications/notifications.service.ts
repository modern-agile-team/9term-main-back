import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { GroupsRepository } from 'src/groups/groups.repository';
import {
  toFallbackNotification,
  toNotificationResponseDto,
} from './notifications.mapper';
import { NotificationsRepository } from './notifications.repository';
import { NotificationResponseDto } from './types/notification-response.type';
import { NotificationSignal } from './types/notification-signal.type';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly userSubjects = new Map<
    number,
    Subject<NotificationSignal>
  >();

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly groupsRepository: GroupsRepository,
  ) {}

  subscribeToUser(userId: number): Observable<NotificationSignal> {
    if (!this.userSubjects.has(userId)) {
      this.userSubjects.set(userId, new Subject<NotificationSignal>());
    }
    return this.userSubjects.get(userId)!.asObservable();
  }

  private sendNotification(recipientIds: number[]) {
    recipientIds.forEach((userId) => {
      const subject = this.userSubjects.get(userId);

      if (subject) {
        subject.next({ type: 'NEW_NOTIFICATION' });
      }
    });
  }

  // 특정 사용자의 알림 목록 조회
  async getNotificationsByUserId(
    userId: number,
  ): Promise<NotificationResponseDto[]> {
    const userNotifications =
      await this.notificationsRepository.getUserNotifications(userId);

    return userNotifications.map((n) => {
      try {
        return toNotificationResponseDto(n);
      } catch (err) {
        this.logger.error(`${err} (id=${n.notification.id})`);

        return toFallbackNotification(n);
      }
    });
  }

  // 특정 알림 읽음 상태 변경
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification =
      await this.notificationsRepository.findUserNotification(
        notificationId,
        userId,
      );

    if (!notification) {
      throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
    }
    return await this.notificationsRepository.markAsRead(
      notificationId,
      userId,
    );
  }

  // 모든 알림 읽음 상태 변경
  async clearNotifications(userId: number): Promise<void> {
    await this.notificationsRepository.markAllAsRead(userId);
  }

  // 특정 알림 삭제
  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    const notification =
      await this.notificationsRepository.findUserNotification(
        notificationId,
        userId,
      );

    if (!notification) {
      throw new NotFoundException('해당 알림을 찾을 수 없습니다.');
    }

    await this.notificationsRepository.deleteUserNotification(
      notificationId,
      userId,
    );
  }

  // 가입 신청 알림 로직
  async notifyByJoinRequest(
    group: { id: number; name: string },
    sender: { id: number; name: string },
    recipientIds: number[],
  ): Promise<NotificationResponseDto> {
    const message = `${sender.name}님이 ${group.name} 그룹 가입을 요청했습니다.`;

    // DB 저장
    const notification =
      await this.notificationsRepository.createJoinRequestNoti(
        sender.id,
        group.id,
        message,
        recipientIds,
      );

    const response = toNotificationResponseDto(notification);
    this.sendNotification(recipientIds);

    return response;
  }

  // 새 게시물 알림 로직
  async notifyByNewPost(
    post: { id: number; title: string; userId: number; groupId: number },
    recipientIds: number[],
  ): Promise<NotificationResponseDto> {
    const group = await this.groupsRepository.findGroupById(post.groupId);
    if (!group) {
      throw new NotFoundException('그룹 정보를 찾을 수 없습니다.');
    }

    const message = `${group.name}에 새 게시물 '${post.title}'이(가) 등록되었습니다.`;

    const notification = await this.notificationsRepository.createPostNoti(
      post.userId,
      post.groupId,
      post.id,
      message,
      recipientIds,
    );
    const response = toNotificationResponseDto(notification);
    this.sendNotification(recipientIds);

    return response;
  }
}
