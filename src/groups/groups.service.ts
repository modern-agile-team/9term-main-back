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
import { UserGroupRole } from '@prisma/client';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly membersService: MembersService,
    private readonly s3Service: S3Service,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<GroupResponseDto> {
    const existingGroup = await this.groupsRepository.findGroupByName(
      createGroupDto.name,
    );
    let groupImagePath: string | undefined;

    if (existingGroup) {
      throw new ConflictException('이미 존재하는 그룹 이름입니다.');
    }

    try {
      if (fileToUpload) {
        groupImagePath = await this.s3Service.uploadFile(
          fileToUpload,
          S3ObjectType.GROUP,
        );
      }

      const createGroupData: CreateGroupInput = {
        ...createGroupDto,
        userId,
        groupImagePath,
      };

      const createdGroup =
        await this.groupsRepository.createGroupWithAdmin(createGroupData);

      return plainToInstance(GroupResponseDto, createdGroup, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      if (groupImagePath) {
        await this.s3Service.deleteFile(groupImagePath);
      }
      throw err;
    }
  }

  async findAllGroups(): Promise<GroupWithMemberCountDto[]> {
    const groups = await this.groupsRepository.findAllGroups();

    return Promise.all(
      groups.map(async (group) => {
        const groupImagePath = group.groupImgPath ?? null;
        const groupImageUrl = groupImagePath
          ? this.s3Service.getFileUrl(groupImagePath)
          : null;

        return plainToInstance(
          GroupWithMemberCountDto,
          {
            ...group,
            memberCount: group._count.userGroups,
            groupImageUrl,
          },
          { excludeExtraneousValues: true },
        );
      }),
    );
  }

  async getGroupWithJoinStatus(
    groupId: number,
    userId?: number,
  ): Promise<GroupJoinStatusDto> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }
    const groupImagePath = group.groupImgPath ?? null;
    const groupImageUrl = groupImagePath
      ? this.s3Service.getFileUrl(groupImagePath)
      : null;

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
        groupImageUrl,
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
    if (!userGroup || userGroup.role !== UserGroupRole.MANAGER) {
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

  async upsertGroupImage(
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<GroupResponseDto> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    const userGroup = await this.groupsRepository.findGroupUser(
      groupId,
      userId,
    );
    if (!userGroup || userGroup.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const previousKey = await this.groupsRepository.findGroupImagePath(groupId);

    // 이미지 제거 요청
    if (!fileToUpload) {
      const isCleared =
        await this.groupsRepository.clearGroupImagePathIfPresent(groupId);

      if (isCleared && previousKey) {
        await this.s3Service.deleteFile(previousKey).catch(() => undefined);
      }

      const updated = await this.groupsRepository.findGroupById(groupId);
      return plainToInstance(GroupResponseDto, updated, {
        excludeExtraneousValues: true,
      });
    }

    // 이미지 교체 요청
    const uploadedKey = await this.s3Service.uploadFile(
      fileToUpload,
      S3ObjectType.GROUP,
    );

    const updatedGroup = await this.groupsRepository.updateGroupById(groupId, {
      groupImgPath: uploadedKey,
    });

    if (previousKey) {
      await this.s3Service.deleteFile(previousKey).catch(() => undefined);
    }

    return plainToInstance(GroupResponseDto, updatedGroup, {
      excludeExtraneousValues: true,
    });
  }
}
