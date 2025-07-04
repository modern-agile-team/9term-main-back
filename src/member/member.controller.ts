import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MembersService } from './member.service';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('groups/:groupId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get()
  async getMemberList(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.membersService.getMemberList(groupId);
  }

  // 그룹 멤버 조회 (멤버만 조회 가능)
  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get(':userId')
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membersService.getGroupMember(groupId, userId);
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

    return this.membersService.removeMember(groupId, userId, requesterUserId);
  }
}
