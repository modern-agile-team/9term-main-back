import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Post,
  Body,
  Query,
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
    return this.membersService.getMembersByGroupWithStatusString(
      groupId,
      status,
    );
  }

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiMembers.getOne()
  async getGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MemberResponseDto> {
    return this.membersService.getGroupMember(groupId, id);
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
    @User() user: AuthenticatedUser,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    return this.membersService.updateMemberStatus(
      groupId,
      userId,
      updateStatusDto.action,
      user.userId,
    );
  }

  @UseGuards(CustomJwtAuthGuard, GroupManagerGuard)
  @Post(':id/role')
  @ApiBearerAuth('access-token')
  @ApiMembers.updateRole()
  async updateMemberRole(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('id', ParseIntPipe) targetUserId: number,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: AuthenticatedUser,
  ): Promise<{ message: string; member: MemberResponseDto }> {
    return this.membersService.updateMemberRole(
      groupId,
      user.userId,
      targetUserId,
      dto,
    );
  }
}
