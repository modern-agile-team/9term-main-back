import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  ParseEnumPipe,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';
import { User } from 'src/auth/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { CustomJwtAuthGuard } from '../auth/guards/access.guard';
import { AuthenticatedUserResponse } from '../auth/interfaces/authenticated-user-response.interface';
import { UpdateNameDto } from './dto/requests/update-profile.dto';
import { UserGroupSummaryDto } from './dto/responses/user-group-summary.dto';
import { UserProfileDto } from './dto/responses/user-profile.dto';
import { UsersService } from './users.service';
import { ApiUsers } from './users.swagger';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('access-token')
@UseGuards(CustomJwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiUsers.getProfile()
  async getProfile(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const userProfileData = await this.usersService.getProfile(user.userId);

    return {
      status: 'success',
      message: '내 정보 조회 성공',
      data: userProfileData,
    };
  }

  @Patch('me/name')
  @ApiUsers.updateProfileName()
  async updateProfileName(
    @Body() updateNameDto: UpdateNameDto,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const updatedUser = await this.usersService.updateProfileName(
      user.userId,
      updateNameDto.name,
    );

    return {
      status: 'success',
      message: '이름이 성공적으로 변경되었습니다.',
      data: updatedUser,
    };
  }

  @Patch('me/image')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiUsers.updateProfileImage()
  async updateProfileImage(
    @UploadedFile() profileImage: Express.Multer.File,
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const userId = user.userId;

    if (!profileImage) {
      throw new BadRequestException(
        '프로필 이미지를 업데이트하려면 파일이 필요합니다.',
      );
    }

    const updatedUser = await this.usersService.updateProfileImage(
      userId,
      profileImage,
    );

    return {
      status: 'success',
      message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      data: updatedUser,
    };
  }

  @Delete('me/image')
  @ApiUsers.deleteProfileImage()
  async deleteMyProfileImage(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const userId = user.userId;

    const updatedUser = await this.usersService.resetProfileImage(userId);

    return {
      status: 'success',
      message: '프로필 이미지가 기본 이미지로 변경되었습니다.',
      data: updatedUser,
    };
  }

  @Get('me/groups')
  @ApiUsers.getMyGroups()
  async getMyGroups(
    @User() user: AuthenticatedUserResponse,
    @Query('status', new ParseEnumPipe(MembershipStatus, { optional: true }))
    status?: MembershipStatus,
  ): Promise<ApiResponseDto<UserGroupSummaryDto[]>> {
    const data = await this.usersService.findMyGroups(user.userId, status);
    return { status: 'success', message: '내 그룹 목록 조회 성공', data };
  }
}
