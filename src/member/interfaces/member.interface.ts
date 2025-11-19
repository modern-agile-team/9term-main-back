export interface Member {
  userId: number;
  username: string;
  name: string;
  role: string;
  joinedAt: Date;
}

export interface GroupMember extends Member {
  groupId: number;
}

export interface UserGroup {
  userId: number;
  groupId: number;
  role: string;
  createdAt: Date;
}
