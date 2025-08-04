import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  Patch,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { GroupWithMemberCountDto } from './dto/group-with-member-count.dto';
import { GroupJoinStatusDto } from './dto/group-join-status.dto';
import { GroupUserResponseDto } from './dto/group-user-response.dto';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { Request } from 'express';
import { AuthenticatedUserResponse } from 'src/auth/interfaces/authenticated-user-response.interface';
import { ApiGroups } from './group.swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUserResponse;
}

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
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string; data: GroupResponseDto }> {
    const userId = req.user.userId;

    const createdGroup = await this.groupsService.createGroup(
      createGroupDto,
      userId,
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
  @ApiGroups.getOne()
  async findGroupWithJoinStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: GroupJoinStatusDto;
  }> {
    const userId = req.user?.userId;
    const groupData = await this.groupsService.getGroupWithJoinStatus(
      groupId,
      userId,
    );

    return {
      status: 'success',
      message: `그룹 ID ${groupId}의 정보를 성공적으로 가져왔습니다.`,
      data: groupData,
    };
  }

  @Post(':groupId')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth()
  @ApiGroups.join()
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    status: string;
    message: string;
    data: GroupUserResponseDto;
  }> {
    const userId = req.user.userId;

    const joinedGroupData = await this.groupsService.joinGroup({
      userId,
      groupId,
      role: 'member',
    });

    return {
      status: 'success',
      message: '가입이 성공적으로 되었습니다!',
      data: joinedGroupData,
    };
  }

  @Patch(':groupId')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth()
  @ApiGroups.update()
  async updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: string; message: string; data: GroupResponseDto }> {
    const userId = req.user.userId;
    const updatedGroup = await this.groupsService.updateGroup(
      groupId,
      userId,
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
  async updateGroupImage(
    @Param('groupId', ParseIntPipe) groupId: number,
    @UploadedFile() uploadFile: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponseDto<GroupResponseDto>> {
    const userId = req.user.userId;

    const updatedGroup = await this.groupsService.upsertGroupImage(
      groupId,
      userId,
      uploadFile,
    );

    return {
      status: 'success',
      message: '그룹 이미지가 성공적으로 변경되었습니다.',
      data: updatedGroup,
    };
  }
}
