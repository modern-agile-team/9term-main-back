import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/auth/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { CustomJwtAuthGuard } from '../auth/guards/access.guard';
import { AuthenticatedUserResponse } from '../auth/interfaces/authenticated-user-response.interface';
import { UserProfileDto } from './dto/responses/user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('access-token')
@UseGuards(CustomJwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const userProfileData = await this.usersService.findMyProfile(user.userId);

    return {
      status: 'success',
      message: '내 정보 조회 성공',
      data: userProfileData,
    };
  }

  @Patch('me/profile-image')
  @UseInterceptors(FileInterceptor('profileImage'))
  async updateMyProfile(
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

  @Delete('me/profile-image')
  async deleteMyProfileImage(
    @User() user: AuthenticatedUserResponse,
  ): Promise<ApiResponseDto<UserProfileDto>> {
    const userId = user.userId;

    const updatedUser = await this.usersService.deleteProfileImage(userId);

    return {
      status: 'success',
      message: '프로필 이미지가 기본 이미지로 변경되었습니다.',
      data: updatedUser,
    };
  }
}
