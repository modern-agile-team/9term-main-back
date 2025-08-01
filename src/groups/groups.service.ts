import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
import { CreateGroupImageDto } from './dto/create-group-image.dto';

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

  async createGroupImage(
    groupId: number,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<CreateGroupImageDto> {
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

    if (!fileToUpload) {
      throw new BadRequestException('업로드할 이미지가 없습니다.');
    }

    const uploadedImageKey = await this.s3Service.uploadFile(
      fileToUpload,
      S3ObjectType.GROUP,
    );

    const isSet = await this.groupsRepository.setGroupImagePathIfEmpty(
      groupId,
      uploadedImageKey,
    );

    if (!isSet) {
      await this.s3Service.deleteFile(uploadedImageKey).catch(() => undefined);
      throw new ConflictException(
        '이미 그룹 이미지가 존재합니다. 먼저 삭제해주세요.',
      );
    }

    const imageUrl = this.s3Service.getFileUrl(uploadedImageKey);
    return plainToInstance(
      CreateGroupImageDto,
      { imageKey: uploadedImageKey, imageUrl },
      { excludeExtraneousValues: true },
    );
  }

  async deleteGroupImage(groupId: number, userId: number): Promise<void> {
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

    const previousImageKey =
      await this.groupsRepository.findGroupImagePath(groupId);
    if (!previousImageKey) {
      return;
    }

    const isCleared =
      await this.groupsRepository.clearGroupImagePathIfPresent(groupId);
    if (!isCleared) {
      return;
    }

    await this.s3Service.deleteFile(previousImageKey).catch(() => undefined);
  }
}
