import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomJwtAuthGuard } from 'src/auth/guards/access.guard';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { User } from 'src/auth/user.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { ToggleLikeResult } from 'src/likes/interfaces/postlikes.interface';
import { PostLikesService } from 'src/likes/post-likes.service';
import { ApiLikes } from './post-likes.swagger';

@ApiTags('PostLikes')
@ApiBearerAuth('access-token')
@UseGuards(CustomJwtAuthGuard)
@Controller('/groups/:groupId/posts/:postId')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  @Post('/likes')
  @ApiLikes.createLike()
  async toggleLike(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<ToggleLikeResult>> {
    return this.postLikesService.createLike(groupId, postId, user.userId);
  }

  @Delete('/likes')
  @ApiLikes.deleteLike()
  async toggleUnlike(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ApiResponseDto<ToggleLikeResult>> {
    return this.postLikesService.deleteLike(groupId, postId, user.userId);
  }
}
