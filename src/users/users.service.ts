import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { UserProfileDto } from 'src/users/dto/reponses/user-profile.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(userData: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.createUser(userData);
  }

  async findUserByUsername(username: string) {
    return this.usersRepository.findByUsername(username);
  }

  async findMyProfile(userId: number): Promise<UserProfileDto> {
    const user: User | null = await this.usersRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return plainToInstance(
      UserProfileDto,
      {
        userId: user.id,
        name: user.name,
        username: user.username,
      },
      { excludeExtraneousValues: true },
    );
  }
}
