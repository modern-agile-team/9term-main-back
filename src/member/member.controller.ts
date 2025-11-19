import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Post,
  Body,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { MembersService } from './member.service';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MemberResponseDto } from './dto/member-response.dto';
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MemberSwagger, ApiMembers } from './member.swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../auth/user.decorator';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { MemberAction } from './member-action.enum';
import { MembershipStatus } from '@prisma/client';

@Controller('groups/:groupId/members')
@MemberSwagger()
@ApiBearerAuth('access-token')
@UseGuards(CustomJwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(GroupMemberGuard)
  @Get()
  @ApiMembers.getList()
  async getMemberList(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('status', new ParseEnumPipe(MembershipStatus, { optional: true }))
    status?: MembershipStatus,
  ): Promise<ApiResponseDto<MemberResponseDto[]>> {
    const data = await this.membersService.getMembersByGroup(groupId, status);
    return {
      status: 'success',
      message: '멤버 목록이 성공적으로 조회되었습니다.',
      data,
    };
  }

  @UseGuards(GroupMemberGuard)
  @Get(':id')
  @ApiMembers.getOne()
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<MemberResponseDto>> {
    const data = await this.membersService.getGroupMember(groupId, id);
    return {
      status: 'success',
      message: '멤버가 성공적으로 조회되었습니다.',
      data,
    };
  }

  @Post()
  @ApiMembers.join()
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() joinMemberDto: JoinMemberRequestDto,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<MemberResponseDto>> {
    const member = await this.membersService.joinGroup({
      ...joinMemberDto,
      groupId,
      userId: user.userId,
    });
    return {
      status: 'success',
      message: '가입 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.',
      data: member,
    };
  }

  @UseGuards(GroupManagerGuard)
  @Post(':id/status')
  @ApiMembers.updateStatus()
  async updateMemberStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateStatusDto: UpdateMemberStatusDto,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<MemberResponseDto>> {
    const member = await this.membersService.updateMemberStatus(
      groupId,
      userId,
      updateStatusDto.action,
      user.userId,
    );
    const messageMap = {
      APPROVE: '가입 신청이 승인되었습니다.',
      REJECT: '가입 신청이 거절되었습니다.',
      LEFT: '그룹을 탈퇴했습니다.',
    } as const;
    return {
      status: 'success',
      message: messageMap[updateStatusDto.action],
      data: member,
    };
  }

  @UseGuards(GroupManagerGuard)
  @Post(':id/role')
  @ApiMembers.updateRole()
  async updateMemberRole(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<MemberResponseDto>> {
    const member = await this.membersService.updateMemberRole(
      groupId,
      user.userId,
      targetUserId,
      dto,
    );
    return {
      status: 'success',
      message: '역할이 변경되었습니다.',
      data: member,
    };
  }

  @UseGuards(GroupMemberGuard)
  @Post('me/leave')
  @ApiMembers.leaveSelf()
  async leaveSelf(
    @Param('groupId', ParseIntPipe) groupId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<MemberResponseDto>> {
    const member = await this.membersService.updateMemberStatus(
      groupId,
      user.userId,
      MemberAction.LEFT,
      user.userId,
    );
    return { status: 'success', message: '그룹을 탈퇴했습니다.', data: member };
  }
}
