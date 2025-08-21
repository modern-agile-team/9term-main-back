import { Prisma, User } from '@prisma/client';
import { UserProfileDto } from '../dto/responses/user-profile.dto';

export interface IUsersRepository {
  findByUsername(username: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  createUser(userData: CreateUserInput): Promise<User>;
}

export interface IUsersService {
  createUser(userData: CreateUserInput): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  findMyProfile(userId: number): Promise<UserProfileDto>;
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
