import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  Post,
  Body,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MembersService } from './member.service';
import { GroupMemberGuard } from './guards/group-member.guard';
import { GroupManagerGuard } from './guards/group-manager.guard';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MemberResponseDto } from './dto/member-response.dto';
import { JoinMemberRequestDto } from './dto/join-member-request.dto';
import {
  UpdateMemberStatusDto,
  MemberAction,
} from './dto/update-member-status.dto';
import { MemberSwagger, ApiMembers } from './member.swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserGroupRole, MembershipStatus } from '@prisma/client';
import { User } from '../auth/user.decorator';

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
    @User() user: AuthenticatedUser,
    @Query('status') status?: string,
  ): Promise<MemberResponseDto[]> {
    if (!status) {
      return this.membersService.getAllMembersWithStatus(groupId);
    }

    const managerOnlyStatuses: MembershipStatus[] = [
      MembershipStatus.PENDING,
      MembershipStatus.REJECTED,
      MembershipStatus.LEFT,
    ];
    if (status && managerOnlyStatuses.includes(status as MembershipStatus)) {
      const member = await this.membersService.getGroupMember(
        groupId,
        user.userId,
      );
      if (!member || member.role !== UserGroupRole.MANAGER) {
        throw new ForbiddenException(
          '매니저만 해당 상태의 멤버를 조회할 수 있습니다.',
        );
      }
    }

    switch (status) {
      case MembershipStatus.PENDING:
        return this.membersService.getPendingMembers(groupId);
      case MembershipStatus.APPROVED:
        return this.membersService.getApprovedMembers(groupId);
      case MembershipStatus.REJECTED:
        return this.membersService.getRejectedMembers(groupId);
      case MembershipStatus.LEFT:
        return this.membersService.getLeftMembers(groupId);
      default:
        throw new BadRequestException(
          `유효하지 않은 status 값입니다: ${status}`,
        );
    }
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
    @Body() joinMemberDto: JoinMemberRequestDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    return this.membersService.joinGroup({
      ...joinMemberDto,
      groupId,
      userId: user.userId,
    });
  }

  @UseGuards(CustomJwtAuthGuard)
  @Post(':id/status')
  @ApiBearerAuth('access-token')
  @ApiMembers.updateStatus()
  async updateMemberStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateStatusDto: UpdateMemberStatusDto,
    @User() requester: AuthenticatedUser,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    const requesterUserId = requester.userId;
    const { action } = updateStatusDto;

    if (action !== MemberAction.LEFT && userId === requesterUserId) {
      throw new ForbiddenException('자신의 상태를 변경할 수 없습니다.');
    }

    if (action === MemberAction.LEFT && userId !== requesterUserId) {
      throw new ForbiddenException('본인만 탈퇴할 수 있습니다.');
    }

    if (action === MemberAction.APPROVE || action === MemberAction.REJECT) {
      const requesterMember = await this.membersService.getGroupMember(
        groupId,
        requesterUserId,
      );
      if (!requesterMember || requesterMember.role !== UserGroupRole.MANAGER) {
        throw new ForbiddenException(
          '매니저만 가입 신청을 처리할 수 있습니다.',
        );
      }
    }

    let updatedMember: MemberResponseDto;
    let message: string;

    switch (action) {
      case MemberAction.APPROVE: {
        updatedMember = await this.membersService.approveMembership(
          groupId,
          userId,
        );
        message = '가입 신청이 승인되었습니다.';
        break;
      }
      case MemberAction.REJECT: {
        updatedMember = await this.membersService.rejectMembership(
          groupId,
          userId,
        );
        message = '가입 신청이 거절되었습니다.';
        break;
      }
      case MemberAction.LEFT: {
        const leftResult = await this.membersService.leaveGroup(
          groupId,
          userId,
        );
        updatedMember = leftResult.member;
        message = leftResult.message;
        break;
      }
      default: {
        throw new ForbiddenException('올바르지 않은 액션입니다.');
      }
    }

    return { message, member: updatedMember };
  }
}
