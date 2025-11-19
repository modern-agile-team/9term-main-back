import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class JoinRequestPayload {
  @ApiProperty()
  groupId: number;
}

export class NewPostPayload {
  @ApiProperty()
  groupId: number;

  @ApiProperty()
  postId: number;
}

@ApiExtraModels(JoinRequestPayload, NewPostPayload)
export class NotificationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    description: '알림 타입에 따라 달라지는 추가 데이터',
    oneOf: [
      { $ref: getSchemaPath(JoinRequestPayload) },
      { $ref: getSchemaPath(NewPostPayload) },
      { type: 'null' },
    ],
  })
  payload: JoinRequestPayload | NewPostPayload | null;
}
