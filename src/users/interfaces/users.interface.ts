import { Prisma, User } from '@prisma/client';

export interface IUsersRepository {
  findByUsername(username: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  createUser(userData: CreateUserInput): Promise<User>;
}

export interface IUsersService {
  createUser(userData: CreateUserInput): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  findMyProfile(userId: number): Promise<UserProfile>;
}
export interface UserSummary {
  userId: number;
  name: string;
  username: string;
}

export interface UserProfile extends UserSummary {
  profileImgPath: string | null;
}

export type CreateUserInput = Prisma.UserCreateInput;
