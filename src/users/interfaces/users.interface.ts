import { Prisma, User } from '@prisma/client';
import { UserProfileDto } from '../dto/responses/user-profile.dto';

export interface IUsersRepository {
  findByUsername(username: string): Promise<User | null>;
  findUserById(id: number): Promise<User | null>;
  createUser(userData: Prisma.UserCreateInput): Promise<User>;
  updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User>;
}

export interface IUsersService {
  createUser(userData: Prisma.UserCreateInput): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;
  getProfile(userId: number): Promise<UserProfileDto>;
  updateProfileImage(
    userId: number,
    profileImageFile: Express.Multer.File,
  ): Promise<UserProfileDto>;
  resetProfileImage(userId: number): Promise<UserProfileDto>;
}
