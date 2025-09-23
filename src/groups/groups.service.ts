import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GroupRecruitStatus, UserGroupRole } from '@prisma/client';

import { GroupsRepository } from './groups.repository';
import { MembersService } from '../member/member.service';
import { S3Service } from 'src/s3/s3.service';
import { S3ObjectType } from 'src/s3/s3.types';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupWithMemberCountDto } from './dto/group-with-member-count.dto';
import { GroupJoinStatusDto } from './dto/group-join-status.dto';
import { CreateGroupInput, UpdateGroupInput } from './types/group-inputs';

@Injectable()
export class GroupsService {
  private static readonly DEFAULT_GROUP_IMAGE_KEY =
    process.env.DEFAULT_GROUP_IMAGE_URL!;

  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly membersService: MembersService,
    private readonly s3Service: S3Service,
  ) {}

  private resolveGroupImageUrl(key?: string | null): string {
    const effectiveKey = key ?? GroupsService.DEFAULT_GROUP_IMAGE_KEY;
    return this.s3Service.getFileUrl(effectiveKey);
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<GroupResponseDto> {
    const existingGroup = await this.groupsRepository.findGroupByName(
      createGroupDto.name,
    );
    if (existingGroup) {
      throw new ConflictException('이미 존재하는 그룹 이름입니다.');
    }

    const createData: CreateGroupInput = {
      ...createGroupDto,
      userId,
      groupImagePath: undefined,
    };

    const createdGroup =
      await this.groupsRepository.createGroupWithAdmin(createData);

    let uploadedImageKey: string | undefined;

    try {
      if (fileToUpload) {
        uploadedImageKey = await this.s3Service.uploadFile(fileToUpload, {
          type: S3ObjectType.GROUP,
          groupId: createdGroup.id,
        });

        await this.groupsRepository.updateGroupById(createdGroup.id, {
          groupImgPath: uploadedImageKey,
        });
      }

      const groupForResponse = uploadedImageKey
        ? await this.groupsRepository.findGroupById(createdGroup.id)
        : createdGroup;

      return plainToInstance(GroupResponseDto, groupForResponse, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (uploadedImageKey) {
        await this.s3Service
          .deleteFile(uploadedImageKey)
          .catch(() => undefined);
      }
      throw error;
    }
  }

  async findAllGroups(): Promise<GroupWithMemberCountDto[]> {
    const groups = await this.groupsRepository.findAllGroups();

    return Promise.all(
      groups.map(async (group) =>
        plainToInstance(
          GroupWithMemberCountDto,
          {
            ...group,
            memberCount: group._count.userGroups,
            groupImageUrl: this.resolveGroupImageUrl(group.groupImgPath),
            groupBannerUrl: this.resolveGroupImageUrl(group.groupBannerPath),
          },
          { excludeExtraneousValues: true },
        ),
      ),
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

    const groupImageUrl = this.resolveGroupImageUrl(group.groupImgPath);
    const groupBannerUrl = this.resolveGroupImageUrl(group.groupBannerPath);

    if (!userId) {
      return plainToInstance(
        GroupJoinStatusDto,
        { isJoined: false, role: null, groupImageUrl, groupBannerUrl },
        { excludeExtraneousValues: true },
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
      { excludeExtraneousValues: true },
    );
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

    const member = await this.groupsRepository.findGroupUser(groupId, userId);
    if (!member || member.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const updatedGroup = await this.groupsRepository.updateGroupById(groupId, {
      ...updateGroupDto,
    } satisfies UpdateGroupInput);

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

    const member = await this.groupsRepository.findGroupUser(groupId, userId);
    if (!member || member.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const previousImageKey =
      await this.groupsRepository.findGroupImagePath(groupId);

    if (!fileToUpload) {
      const cleared =
        await this.groupsRepository.clearGroupImagePathIfPresent(groupId);

      if (cleared && previousImageKey) {
        await this.s3Service
          .deleteFile(previousImageKey)
          .catch(() => undefined);
      }

      const refreshedGroup = await this.groupsRepository.findGroupById(groupId);
      return plainToInstance(GroupResponseDto, refreshedGroup, {
        excludeExtraneousValues: true,
      });
    }

    const uploadedImageKey = await this.s3Service.uploadFile(fileToUpload, {
      type: S3ObjectType.GROUP,
      groupId,
    });

    const updatedGroup = await this.groupsRepository.updateGroupById(groupId, {
      groupImgPath: uploadedImageKey,
    });

    if (previousImageKey) {
      await this.s3Service.deleteFile(previousImageKey).catch(() => undefined);
    }

    return plainToInstance(GroupResponseDto, updatedGroup, {
      excludeExtraneousValues: true,
    });
  }

  async removeGroup(groupId: number): Promise<void> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    await this.groupsRepository.deleteGroupById(groupId);

    await this.s3Service
      .deleteAllByPrefixes([
        `group/${groupId}/`,
        `post/${groupId}/`,
        `groupBanner/${groupId}/`,
      ])
      .catch(() => undefined);
  }

  async updateRecruitStatus(
    groupId: number,
    recruitStatus: GroupRecruitStatus,
  ): Promise<void> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    await this.groupsRepository.updateGroupById(groupId, {
      recruitStatus,
    });
  }

  async upsertGroupBanner(
    groupId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<string | null> {
    const group = await this.groupsRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`그룹 ID ${groupId}를 찾을 수 없습니다.`);
    }

    const previousBannerKey = group.groupBannerPath ?? null;

    if (!fileToUpload) {
      await this.groupsRepository.updateGroupById(groupId, {
        groupBannerPath: null,
      } as UpdateGroupInput);

      if (previousBannerKey) {
        await this.s3Service
          .deleteFile(previousBannerKey)
          .catch(() => undefined);
      }
      return null;
    }

    const uploadedBannerKey = await this.s3Service.uploadFile(fileToUpload, {
      type: S3ObjectType.GROUP_BANNER,
      groupId,
    });

    await this.groupsRepository.updateGroupById(groupId, {
      groupBannerPath: uploadedBannerKey,
    } as UpdateGroupInput);

    if (previousBannerKey) {
      await this.s3Service.deleteFile(previousBannerKey).catch(() => undefined);
    }

    return this.s3Service.getFileUrl(uploadedBannerKey);
  }
}
