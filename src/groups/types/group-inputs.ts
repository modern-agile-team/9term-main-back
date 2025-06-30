export interface CreateGroupInput {
  name: string;
  description: string;
  userId: number;
}

export interface GroupUserInput {
  userId: number;
  groupId: number;
  role: 'admin' | 'member';
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}
