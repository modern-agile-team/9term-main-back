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
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Request } from 'express';
import { CustomJwtAuthGuard } from 'src/auth/guards/custom-jwt-auth.guard';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(CustomJwtAuthGuard)
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;
    const group = await this.groupsService.createGroup(createGroupDto, userId);
    return {
      status: 'success',
      message: '그룹이 성공적으로 생성되었습니다.',
      data: group,
    };
  }

  @Get()
  async findAllGroups() {
    const groups = await this.groupsService.findAllGroups();
    return {
      status: 'success',
      message: '그룹 목록을 성공적으로 가져왔습니다.',
      data: groups,
    };
  }

  @Get(':groupId')
  @UseGuards(OptionalJwtAuthGuard)
  async getGroupWithJoinStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.userId;
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
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;

    const joinGroupDto: JoinGroupDto = {
      userId,
      groupId,
      role: 'member',
    };

    const joinedGroupData = await this.groupsService.joinGroup(joinGroupDto);

    return {
      status: 'success',
      message: '가입이 성공적으로 되었습니다!',
      data: joinedGroupData,
    };
  }

  @Patch(':groupId')
  @UseGuards(CustomJwtAuthGuard)
  async updateGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).userId;

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
}
