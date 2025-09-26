import { GroupRecruitStatus, UserGroupRole } from '@prisma/client';

export interface CreateGroupInput {
  name: string;
  description: string;
  userId: number;
  groupImagePath?: string;
}

export interface GroupUserInput {
  userId: number;
  groupId: number;
  role: UserGroupRole;
  groupImagePath: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  groupImagePath?: string | null;
  recruitStatus?: GroupRecruitStatus;
  groupBannerPath?: string | null;
}
