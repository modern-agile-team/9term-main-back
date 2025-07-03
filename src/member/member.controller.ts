import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Delete,
  UseGuards,
  ForbiddenException,
  Post,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { MembersService } from './member.service';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MemberResponseDto } from './dto/member-response.dto';
import { JoinGroupDto } from '../groups/dto/join-group.dto';

@Controller('groups/:groupId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get()
  async getMemberList(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<MemberResponseDto[]> {
    return this.membersService.getMemberList(groupId);
  }

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get(':userId')
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<MemberResponseDto | null> {
    return this.membersService.getGroupMember(groupId, userId);
  }

  // 그룹 가입
  @UseGuards(CustomJwtAuthGuard)
  @Post()
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() joinGroupDto: JoinGroupDto,
    @Req() req: Request,
  ): Promise<MemberResponseDto> {
    const user = req.user as AuthenticatedUser;
    return this.membersService.joinGroup({
      ...joinGroupDto,
      groupId,
      userId: user.userId,
    });
  }

  // 그룹 매니저만 멤버 삭제 가능
  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Delete(':userId')
  async removeMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: Request,
  ) {
    const requesterUserId = (req.user as AuthenticatedUser)?.userId;
    if (userId === requesterUserId) {
      throw new ForbiddenException('자신을 삭제할 수 없습니다.');
    }
    return this.membersService.processRemoveMember(groupId, userId);
  }
}
