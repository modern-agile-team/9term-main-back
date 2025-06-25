import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsRepository } from './groups.repository';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  async createGroup(createGroupDto: CreateGroupDto, userId: number) {
    const existingGroup = await this.groupsRepository.findGroupByName(
      createGroupDto.name,
    );
    if (existingGroup) {
      throw new ConflictException('이미 존재하는 그룹 이름입니다.');
    }

    const groupData = {
      name: createGroupDto.name,
      description: createGroupDto.description,
      userId,
    };

    const createdGroup =
      await this.groupsRepository.createGroupWithAdmin(groupData);

    return createdGroup;
  }

  async findAllGroups() {
    const groups = await this.groupsRepository.findAllGroups();
    return groups;
  }

  async getGroupWithJoinStatus(groupId: number, userId?: number) {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    const isLoggedIn = !!userId;

    if (!isLoggedIn) {
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        isLoggedIn: false,
        isJoined: false,
        role: null,
      };
    }

    const userGroup = await this.groupsRepository.findUserGroup(
      groupId,
      userId,
    );

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt,
      isLoggedIn: true,
      isJoined: !!userGroup,
      role: userGroup?.role ?? null,
    };
  }

  async joinGroup(joinGroupDto: JoinGroupDto) {
    const existing = await this.groupsRepository.findUserGroup(
      joinGroupDto.groupId,
      joinGroupDto.userId,
    );
    if (existing) {
      throw new BadRequestException('이미 이 그룹에 가입되어 있습니다.');
    }

    return await this.groupsRepository.joinGroup(joinGroupDto);
  }

  async updateGroup(
    groupId: number,
    userId: number,
    updateGroupDto: UpdateGroupDto,
  ) {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    const userGroup = await this.groupsRepository.findUserGroup(
      groupId,
      userId,
    );
    if (!userGroup || userGroup.role !== 'admin') {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const updatedGroup = await this.groupsRepository.updateGroupById(
      groupId,
      updateGroupDto,
    );

    return updatedGroup;
  }
}
