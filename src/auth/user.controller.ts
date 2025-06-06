import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CustomJwtAuthGuard } from 'src/auth/guards/custom-jwt-auth.guard';
import { UserProfileDto, UserProfileResponseDto } from './user.dto';

@ApiTags('User')
@Controller('users')
export class UserController {
  @Get('me')
  @UseGuards(CustomJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '로그인 유저의 정보를 반환',
  })
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({
    description: '토큰이 없거나 유효하지 않음',
    schema: {
      oneOf: [
        {
          example: {
            message: '유효하지 않은 토큰입니다.',
            error: 'Unauthorized',
            statusCode: 401,
          },
        },
        {
          example: {
            message: '인증에 실패했습니다.',
            error: 'Unauthorized',
            statusCode: 401,
          },
        },
        {
          example: {
            message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
            error: 'Unauthorized',
            statusCode: 401,
          },
        },
      ],
    },
  })
  getProfile(@Req() req) {
    const userProfile = new UserProfileDto();
    userProfile.name = req.user.name;

    const response = new UserProfileResponseDto();
    response.status = 'success';
    response.message = '내 정보 조회 성공';
    response.data = userProfile;

    return response;
  }
}
