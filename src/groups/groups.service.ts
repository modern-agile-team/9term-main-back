import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserGroupRole } from '@prisma/client';

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
    const useKey = key ?? GroupsService.DEFAULT_GROUP_IMAGE_KEY;
    return this.s3Service.getFileUrl(useKey);
  }

  async createGroup(
    createGroupDto: CreateGroupDto,
    userId: number,
    fileToUpload?: Express.Multer.File,
  ): Promise<GroupResponseDto> {
    const existing = await this.groupsRepository.findGroupByName(
      createGroupDto.name,
    );
    if (existing) {
      throw new ConflictException('이미 존재하는 그룹 이름입니다.');
    }

    const createBase: CreateGroupInput = {
      ...createGroupDto,
      userId,
      groupImagePath: undefined,
    };
    const created =
      await this.groupsRepository.createGroupWithAdmin(createBase);

    let uploadedKey: string | undefined;
    try {
      if (fileToUpload) {
        uploadedKey = await this.s3Service.uploadFile(fileToUpload, {
          type: S3ObjectType.GROUP,
          groupId: created.id,
        });
        await this.groupsRepository.updateGroupById(created.id, {
          groupImgPath: uploadedKey,
        });
      }

      const finalGroup = uploadedKey
        ? await this.groupsRepository.findGroupById(created.id)
        : created;

      return plainToInstance(GroupResponseDto, finalGroup, {
        excludeExtraneousValues: true,
      });
    } catch (e) {
      if (uploadedKey) {
        await this.s3Service.deleteFile(uploadedKey).catch(() => undefined);
      }
      throw e;
    }
  }

  async findAllGroups(): Promise<GroupWithMemberCountDto[]> {
    const groups = await this.groupsRepository.findAllGroups();

    return Promise.all(
      groups.map(async (g) =>
        plainToInstance(
          GroupWithMemberCountDto,
          {
            ...g,
            memberCount: g._count.userGroups,
            groupImageUrl: this.resolveGroupImageUrl(g.groupImgPath),
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

    if (!userId) {
      return plainToInstance(
        GroupJoinStatusDto,
        { isJoined: false, role: null, groupImageUrl },
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

    const membership = await this.groupsRepository.findGroupUser(
      groupId,
      userId,
    );
    if (!membership || membership.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const updated = await this.groupsRepository.updateGroupById(groupId, {
      ...updateGroupDto,
    } satisfies UpdateGroupInput);

    return plainToInstance(GroupResponseDto, updated, {
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

    const membership = await this.groupsRepository.findGroupUser(
      groupId,
      userId,
    );
    if (!membership || membership.role !== UserGroupRole.MANAGER) {
      throw new ForbiddenException('그룹을 수정할 권한이 없습니다.');
    }

    const previousKey = await this.groupsRepository.findGroupImagePath(groupId);

    if (!fileToUpload) {
      const cleared =
        await this.groupsRepository.clearGroupImagePathIfPresent(groupId);

      if (cleared && previousKey) {
        await this.s3Service.deleteFile(previousKey).catch(() => undefined);
      }

      const refreshed = await this.groupsRepository.findGroupById(groupId);
      return plainToInstance(GroupResponseDto, refreshed, {
        excludeExtraneousValues: true,
      });
    }

    const uploadedKey = await this.s3Service.uploadFile(fileToUpload, {
      type: S3ObjectType.GROUP,
      groupId,
    });

    const updated = await this.groupsRepository.updateGroupById(groupId, {
      groupImgPath: uploadedKey,
    });

    if (previousKey) {
      await this.s3Service.deleteFile(previousKey).catch(() => undefined);
    }

    return plainToInstance(GroupResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }
}
