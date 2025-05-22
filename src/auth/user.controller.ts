import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomJwtAuthGuard } from 'src/auth/guards/custom-jwt-auth.guard';

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
  getProfile(@Req() req) {
    return {
      status: 'success',
      message: '내 정보 조회 성공',
      data: req.user,
    };
  }
}
