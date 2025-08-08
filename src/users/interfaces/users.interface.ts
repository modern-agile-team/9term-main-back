import { Prisma, User } from '@prisma/client';

export interface IUsersRepository {
  findByUsername(username: string): Promise<User | null>;

  findUserById(id: number): Promise<User | null>;

  createUser(userData: Prisma.UserCreateInput): Promise<User>;
}
