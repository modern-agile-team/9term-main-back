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

@Controller('groups/:groupId/members')
@MemberSwagger()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get()
  @ApiMembers.getList()
  async getMemberList(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<MemberResponseDto[]> {
    return this.membersService.getMemberList(groupId);
  }

  @UseGuards(CustomJwtAuthGuard, GroupMemberGuard)
  @Get(':id')
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

  // 그룹 가입
  @UseGuards(CustomJwtAuthGuard)
  @Post()
  @ApiMembers.join()
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
  @Delete(':id')
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
}
