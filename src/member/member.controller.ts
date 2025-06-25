import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './member.service';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { GroupMemberGuard } from './guards/group-member.guard';

@Controller('groups/:groupId/memberlist')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(GroupMemberGuard)
  @Get()
  async getMemberList(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.membersService.getMemberList(groupId);
  }

  // 그룹 멤버 조회 (멤버만 조회 가능)
  @UseGuards(GroupMemberGuard)
  @Get(':userId')
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membersService.getGroupMember(groupId, userId);
  }

  // 그룹 매니저만 멤버 삭제 가능
  @UseGuards(GroupManagerGuard)
  @Delete(':userId')
  async removeMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req,
  ) {
    const requesterUserId = req.user.userId;
    return this.membersService.removeMember(groupId, userId, requesterUserId);
  }
}
