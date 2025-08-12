import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
