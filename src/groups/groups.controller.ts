import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
  UseInterceptors,
  UploadedFile,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/requests/create-group.dto';
import { UpdateGroupDto } from './dto/requests/update-group.dto';
import { GroupResponseDto } from './dto/responses/group-response.dto';
import { GroupWithMemberCountDto } from './dto/responses/group-with-member-count.dto';
import { GroupJoinStatusDto } from './dto/responses/group-join-status.dto';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { ApiGroups } from './group.swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { User } from 'src/auth/user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { GroupManagerGuard } from 'src/member/guards/group-manager.guard';
import { UpdateRecruitStatusDto } from './dto/requests/update-recruit.dto';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('groupImage'))
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiGroups.create()
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @UploadedFile() uploadFile: Express.Multer.File,
    @User() user: AuthenticatedUser,
  ): Promise<{ status: string; message: string; data: GroupResponseDto }> {
    const createdGroup = await this.groupsService.createGroup(
      createGroupDto,
      user.userId,
      uploadFile,
    );

    return {
      status: 'success',
      message: '그룹이 성공적으로 생성되었습니다.',
      data: createdGroup,
    };
  }

  @Get()
  @ApiGroups.getAll()
  async findAllGroups(): Promise<{
    status: string;
    message: string;
    data: GroupWithMemberCountDto[];
  }> {
    const groups = await this.groupsService.findAllGroups();
    return {
      status: 'success',
      message: '그룹 목록을 성공적으로 가져왔습니다.',
      data: groups,
    };
  }

  @Get(':groupId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiGroups.getOne()
  async findGroupWithJoinStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @User() user: AuthenticatedUser,
  ): Promise<{
    status: string;
    message: string;
    data: GroupJoinStatusDto;
  }> {
    const groupData = await this.groupsService.getGroupWithJoinStatus(
      groupId,
      user.userId,
    );

    return {
      status: 'success',
      message: `그룹 ID ${groupId}의 정보를 성공적으로 가져왔습니다.`,
      data: groupData,
    };
  }

  @Patch(':groupId')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth()
  @ApiGroups.update()
  async updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ status: string; message: string; data: GroupResponseDto }> {
    const updatedGroup = await this.groupsService.updateGroup(
      groupId,
      user.userId,
      updateGroupDto,
    );

    return {
      status: 'success',
      message: '그룹 정보가 성공적으로 수정되었습니다.',
      data: updatedGroup,
    };
  }

  @Put(':groupId/image')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('groupImage'))
  @ApiGroups.updateImage()
  async updateGroupImage(
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile() uploadFile: Express.Multer.File,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<{ GroupImageUrl: string | null }>> {
    const updatedGroup = await this.groupsService.upsertGroupImage(
      groupId,
      user.userId,
      uploadFile,
    );

    return {
      status: 'success',
      message: '그룹 이미지가 성공적으로 변경되었습니다.',
      data: { GroupImageUrl: updatedGroup },
    };
  }

  @Delete(':groupId')
  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @ApiBearerAuth()
  @ApiGroups.remove()
  async removeGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<ApiResponseDto<null>> {
    await this.groupsService.removeGroup(groupId);

    return {
      status: 'success',
      message: '그룹이 성공적으로 삭제되었습니다.',
      data: null,
    };
  }

  @Patch(':groupId/recruitment')
  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @ApiBearerAuth()
  @ApiGroups.updateRecruitment()
  async updateRecruitStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateRecruitStatusDto: UpdateRecruitStatusDto,
  ): Promise<void> {
    return this.groupsService.updateRecruitStatus(
      groupId,
      updateRecruitStatusDto.recruitStatus,
    );
  }

  @Put(':groupId/image/banner')
  @ApiBearerAuth()
  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @UseInterceptors(FileInterceptor('groupBannerImage'))
  @ApiConsumes('multipart/form-data')
  @ApiGroups.updateBanner()
  async upsertGroupBanner(
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile() uploadFile?: Express.Multer.File,
  ): Promise<ApiResponseDto<{ GroupBannerImageUrl: string | null }>> {
    const bannerImageUrl = await this.groupsService.upsertGroupBanner(
      groupId,
      uploadFile,
    );

    return {
      status: 'success',
      message: uploadFile
        ? '그룹 배너 이미지가 성공적으로 변경되었습니다.'
        : '그룹 배너 이미지가 성공적으로 제거되었습니다.',
      data: { GroupBannerImageUrl: bannerImageUrl },
    };
  }
}
