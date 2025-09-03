import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { GroupsRepository } from 'src/groups/groups.repository';
import { MemberRepository } from 'src/member/member.repository';
import { UsersRepository } from 'src/users/users.repository';
import { NotificationResponseDto } from './dto/notification.dto';
import { toNotificationResponseDto } from './notifications.mapper';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly userSubjects = new Map<
    number,
    Subject<NotificationResponseDto>
  >();

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly memberRepository: MemberRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  subscribeToUser(userId: number): Observable<NotificationResponseDto> {
    if (!this.userSubjects.has(userId)) {
      this.userSubjects.set(userId, new Subject<NotificationResponseDto>());
    }
    const subject = this.userSubjects.get(userId)!;
    return subject.asObservable();
  }

  private sendNotification(
    recipientIds: number[],
    payload: NotificationResponseDto,
  ) {
    recipientIds.forEach((userId) => {
      const subject = this.userSubjects.get(userId);
      if (subject) {
        subject.next(payload);
      }
    });
  }

  //   // 특정 사용자의 알림 목록 조회
  async getNotificationsByUserId(
    userId: number,
  ): Promise<NotificationResponseDto[]> {
    const userNotifications =
      await this.notificationsRepository.getUserNotifications(userId);

    return userNotifications.map(toNotificationResponseDto);
  }

  // 특정 알림 읽음 상태 변경
  async markAsRead(notificationId: number, userId: number) {
    const result = await this.notificationsRepository.findUserNotification(
      notificationId,
      userId,
    );

    if (!result) {
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
  async notifyJoinRequest(
    groupId: number,
    senderId: number,
    recipientIds: number[],
  ): Promise<NotificationResponseDto> {
    // 알림 생성 여부 확인 (중복 전송 방지)
    const existingNotification =
      await this.notificationsRepository.findJoinRequest(groupId, senderId);

    if (existingNotification) {
      throw new ConflictException(`이미 동일한 알림이 존재합니다.`);
    }

    const [group, sender] = await Promise.all([
      this.groupsRepository.findGroupById(groupId),
      this.usersRepository.findUserById(senderId),
    ]);

    if (!group || !sender) {
      throw new NotFoundException('필수 정보를 찾을 수 없습니다.');
    }
    const message = `${sender.name}님이 ${group.name} 그룹 가입을 요청했습니다.`;

    // DB 저장
    const notification = await this.notificationsRepository.createJoinRequest(
      senderId,
      groupId,
      message,
      recipientIds,
    );

    const response = toNotificationResponseDto(notification);
    // 페이로드 전달
    this.sendNotification(recipientIds, response);

    return response;
  }
}
