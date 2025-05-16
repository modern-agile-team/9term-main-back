import {
  Controller,
  Get,
  Req,
  UseGuards,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Injectable()
export class CustomJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          '토큰이 만료되었습니다. 다시 로그인해주세요.',
        );
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else {
        throw new UnauthorizedException('인증에 실패했습니다.');
      }
    }
    return user;
  }
}

@ApiTags('User')
@Controller('users')
export class UserController {
  @Get('me')
  @UseGuards(CustomJwtAuthGuard) // Custom JWT 인증 가드 사용
  @ApiBearerAuth('access-token') // JWT 인증을 위한 Bearer Token 사용
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
