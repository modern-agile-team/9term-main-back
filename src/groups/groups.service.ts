import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsRepository } from './groups.repository';
import { plainToInstance } from 'class-transformer';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupWithMemberCountDto } from './dto/group-with-member-count.dto';
import { GroupJoinStatusDto } from './dto/group-join-status.dto';
import { GroupUserResponseDto } from './dto/group-user-response.dto';
import { CreateGroupInput, UpdateGroupInput } from './types/group-inputs';
import { MembersService } from '../member/member.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly membersService: MembersService,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
  ): Promise<GroupResponseDto> {
    const existingGroup = await this.groupsRepository.findGroupByName(
      createGroupDto.name,
    );
    if (existingGroup) {
      throw new ConflictException('이미 존재하는 그룹 이름입니다.');
    }

    const createGroupData: CreateGroupInput = {
      ...createGroupDto,
      userId,
    };

    const createdGroup =
      await this.groupsRepository.createGroupWithAdmin(createGroupData);
    return plainToInstance(GroupResponseDto, createdGroup, {
      excludeExtraneousValues: true,
    });
  }

  async findAllGroups(): Promise<GroupWithMemberCountDto[]> {
    const groups = await this.groupsRepository.findAllGroups();

    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.groupsRepository.getMemberCount(
          group.id,
        );
        return plainToInstance(
          GroupWithMemberCountDto,
          {
            ...group,
            memberCount,
          },
          {
            excludeExtraneousValues: true,
          },
        );
      }),
    );

    return groupsWithCounts;
  }

  async getGroupWithJoinStatus(
    groupId: number,
    userId?: number,
  ): Promise<GroupJoinStatusDto> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    if (!userId) {
      return plainToInstance(
        GroupJoinStatusDto,
        {
          isJoined: false,
          role: null,
        },
        {
          excludeExtraneousValues: true,
        },
      );
    }

    const userGroup = await this.groupsRepository.findGroupUser(
      groupId,
      userId,
    );

    return plainToInstance(
      GroupJoinStatusDto,
      {
        isJoined: !!userGroup,
        role: userGroup?.role ?? null,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async joinGroup(joinGroupDto: JoinGroupDto): Promise<GroupUserResponseDto> {
    const createdGroupUser = await this.membersService.joinGroup(joinGroupDto);
    return plainToInstance(GroupUserResponseDto, createdGroupUser, {
      excludeExtraneousValues: true,
    });
  }

  async updateGroup(
    groupId: number,
    userId: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    const userGroup = await this.groupsRepository.findGroupUser(
      groupId,
      userId,
    );
    if (!userGroup || userGroup.role !== 'admin') {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const updateGroupData: UpdateGroupInput = {
      ...updateGroupDto,
    };

    const updatedGroup = await this.groupsRepository.updateGroupById(
      groupId,
      updateGroupData,
    );
    return plainToInstance(GroupResponseDto, updatedGroup, {
      excludeExtraneousValues: true,
    });
  }
}
