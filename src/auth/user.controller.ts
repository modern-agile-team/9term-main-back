import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('users')
export class UserController {
  @Get('me')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 가드 사용
  @ApiBearerAuth('access-token') // JWT 인증을 위한 Bearer Token 사용
  @ApiOperation({
    summary: '내 정보 조회',
    description: '로그인 유저의 정보를 반환',
  })
  getProfile(@Req() req) {
    return req.user;
  }
}
