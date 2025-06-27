export interface Member {
  userId: number;
  userName: string;
  name: string;
  role: string;
  joinedAt: Date;
}

export interface GroupMember extends Member {
  groupId: number;
}
