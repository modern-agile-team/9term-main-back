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
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import { MembersService } from './member.service';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { GroupMemberGuard } from './guards/group-member.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MemberResponseDto } from './dto/member-response.dto';
import { JoinGroupDto } from '../groups/dto/join-group.dto';
import { MemberSwagger, ApiMembers } from './member.swagger';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('groups/:groupId/members')
@MemberSwagger()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiMembers.getList()
  async getMemberList(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<MemberResponseDto[]> {
    return this.membersService.getMemberList(groupId);
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Get('pending')
  @ApiBearerAuth('access-token')
  async getPendingMembers(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<MemberResponseDto[]> {
    return this.membersService.getPendingMembers(groupId);
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Get('all-status')
  @ApiBearerAuth('access-token')
  async getAllMembersWithStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<MemberResponseDto[]> {
    return this.membersService.getAllMembersWithStatus(groupId);
  }

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiMembers.getOne()
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberResponseDto | null> {
    const member = await this.membersService.getGroupMember(groupId, id);
    if (!member) {
      throw new NotFoundException('해당 멤버가 존재하지 않습니다.');
    }
    return member;
  }

  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiMembers.join()
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() joinGroupDto: JoinGroupDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const user = req.user as AuthenticatedUser;
    return this.membersService.joinGroup({
      ...joinGroupDto,
      groupId,
      userId: user.userId,
    });
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Patch(':id/approve')
  @ApiBearerAuth('access-token')
  async approveMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    await this.membersService.approveMembership(groupId, userId);
    return { message: '가입 신청이 승인되었습니다.' };
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Patch(':id/reject')
  @ApiBearerAuth('access-token')
  async rejectMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    await this.membersService.rejectMembership(groupId, userId);
    return { message: '가입 신청이 거절되었습니다.' };
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiMembers.remove()
  async removeMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const requesterUserId = (req.user as AuthenticatedUser)?.userId;
    const member = await this.membersService.getGroupMember(groupId, id);
    if (!member) {
      throw new ForbiddenException('해당 멤버가 존재하지 않습니다.');
    }
    if (member.userId === requesterUserId) {
      throw new ForbiddenException('자신을 삭제할 수 없습니다.');
    }
    return this.membersService.removeMember(groupId, id);
  }

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Post('leave')
  @ApiBearerAuth('access-token')
  async leaveGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.membersService.leaveGroup(groupId, user.userId);
  }
}
