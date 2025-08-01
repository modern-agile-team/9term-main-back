import { UserGroupRole } from '@prisma/client';

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
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

export interface CreateGroupImageInput {
  groupImagePath: string;
}
