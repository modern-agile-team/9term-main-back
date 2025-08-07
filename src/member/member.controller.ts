import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
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
import { MembershipStatus } from '@prisma/client';
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
    @Query('status') status?: string,
  ): Promise<MemberResponseDto[]> {
    if (!status) {
      return this.membersService.getAllMembersWithStatus(groupId);
    }
    const statusEnum =
      MembershipStatus[status as keyof typeof MembershipStatus];
    if (!statusEnum) {
      throw new BadRequestException(`유효하지 않은 status 값입니다: ${status}`);
    }

    switch (statusEnum) {
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
  @Post()
  @ApiBearerAuth('access-token')
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

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Post(':id/status')
  @ApiBearerAuth('access-token')
  @ApiMembers.updateStatus()
  async updateMemberStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateStatusDto: UpdateMemberStatusDto,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    const { action } = updateStatusDto;
    return this.executeAction(groupId, userId, action);
  }

  private async executeAction(
    groupId: number,
    userId: number,
    action: MemberAction,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    switch (action) {
      case MemberAction.APPROVE: {
        const member = await this.membersService.approveMembership(
          groupId,
          userId,
        );
        return { message: '가입 신청이 승인되었습니다.', member };
      }
      case MemberAction.REJECT: {
        const member = await this.membersService.rejectMembership(
          groupId,
          userId,
        );
        return { message: '가입 신청이 거절되었습니다.', member };
      }
      case MemberAction.LEFT: {
        return this.membersService.leaveGroup(groupId, userId);
      }
      default: {
        throw new BadRequestException('올바르지 않은 액션입니다.');
      }
    }
  }
}
