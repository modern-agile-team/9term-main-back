import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import {
  apiErrorResponse,
  apiErrorResponses,
} from 'src/common/swagger/response.helper';
import { CreatePostRequestDto } from './dto/requests/create-post.dto';
import { UpdatePostRequestDto } from './dto/requests/update-post.dto';
import { PostResponseDto } from './dto/responses/post-response.dto';

const badRequestExamples = {
  MissingRequired: {
    message: ['제목과 내용은 비워둘 수 없습니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
  InvalidCategory: {
    message: ['category 값이 올바르지 않습니다.'],
    error: 'Bad Request',
    statusCode: 400,
  },
};

const unauthorizedExamples = {
  TokenExpired: {
    message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
    error: 'Unauthorized',
    statusCode: 401,
  },
  InvalidToken: {
    message: '유효하지 않은 토큰입니다.',
    error: 'Unauthorized',
    statusCode: 401,
  },
};

const forbiddenExamples = {
  AnnouncementForbidden: {
    message: '공지 작성/변경은 매니저만 가능합니다',
    error: 'Forbidden',
    statusCode: 403,
  },
  AuthorForbidden: {
    message: '게시물 수정/삭제 권한이 없습니다.',
    error: 'Forbidden',
    statusCode: 403,
  },
};

const notFoundExamples = {
  PostNotFound: {
    message: 'ID가 {postId}인 게시물을 찾을 수 없습니다.',
    error: 'Not Found',
    statusCode: 404,
  },
  GroupNotFound: {
    message: 'ID가 {groupId}인 그룹을 찾을 수 없습니다.',
    error: 'Not Found',
    statusCode: 404,
  },
};

const apiResponseWithData = <T extends Type<any>>(
  model: T,
  status = 200,
  description = '요청이 성공적으로 처리되었습니다.',
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPosts = {
  create: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 생성',
        description: '새로운 게시물을 생성합니다.',
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        type: CreatePostRequestDto,
      }),
      apiResponseWithData(
        PostResponseDto,
        201,
        '게시물이 성공적으로 생성되었습니다.',
      ),
      apiErrorResponses(400, '잘못된 요청', badRequestExamples),
      apiErrorResponses(401, '유효하지 않은 토큰', unauthorizedExamples),
      apiErrorResponse(
        403,
        '권한 없음',
        forbiddenExamples.AnnouncementForbidden,
      ),
    ),

  getAll: () =>
    applyDecorators(
      ApiOperation({
        summary: '그룹 내 게시물 목록 조회',
        description: '특정 그룹의 게시물 목록을 조회합니다.',
      }),
      ApiResponse({
        status: 200,
        description: '게시물 목록 조회 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물 목록을 성공적으로 가져왔습니다.',
              data: [
                {
                  id: 118,
                  groupId: 15,
                  user: {
                    id: 12,
                    name: '권혁진',
                    profileImageUrl:
                      'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/1.jpg',
                  },
                  createdAt: '2025-08-08T04:42:01.057Z',
                  updatedAt: null,
                  category: 'NORMAL',
                  title: '이하',
                  content: '서',
                  postImageUrl:
                    'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/1.jpg',
                  commentsCount: 1,
                  likesCount: 0,
                  isLiked: false,
                },
                {
                  id: 117,
                  groupId: 15,
                  user: {
                    id: 8,
                    name: '홍길동',
                    profileImageUrl:
                      'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/user_uploads/12345678-example.jpg',
                  },
                  createdAt: '2025-08-07T10:11:22.333Z',
                  updatedAt: '2025-08-07T12:00:00.000Z',
                  category: 'ANNOUNCEMENT',
                  title: '공지입니다',
                  content: '공지 본문...',
                  postImageUrl: null,
                  commentsCount: 0,
                  likesCount: 2,
                  isLiked: true,
                },
              ],
            },
          },
        },
      }),
      apiErrorResponses(401, '유효하지 않은 토큰', unauthorizedExamples),
      apiErrorResponse(
        404,
        '요청한 리소스를 찾을 수 없음',
        notFoundExamples.GroupNotFound,
      ),
    ),

  // getOne: () =>
  //   applyDecorators(
  //     ApiOperation({
  //       summary: '게시물 단건 조회',
  //       description: '게시물 상세 정보를 조회합니다.',
  //     }),
  //     ApiParam({
  //       name: 'groupId',
  //       required: true,
  //       description: '그룹 ID',
  //       schema: { type: 'integer', example: 15 },
  //     }),
  //     ApiParam({
  //       name: 'postId',
  //       required: true,
  //       description: '게시물 ID',
  //       schema: { type: 'integer', example: 118 },
  //     }),
  //     ApiResponse({
  //       status: 200,
  //       description: '게시물 조회 성공',
  //       content: {
  //         'application/json': {
  //           example: {
  //             status: 'success',
  //             message: '게시물을 성공적으로 가져왔습니다.',
  //             data: {
  //               id: 118,
  //               groupId: 15,
  //               user: {
  //                 id: 12,
  //                 name: '권혁진',
  //                 profileImageUrl:
  //                   'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/profile/2.jpg',
  //               },
  //               createdAt: '2025-08-08T04:42:01.057Z',
  //               updatedAt: null,
  //               category: 'NORMAL',
  //               title: '이하',
  //               content: '서',
  //               postImageUrl:
  //                 'https://modgu-main-s3.s3.ap-northeast-2.amazonaws.com/post/2.jpg',
  //               commentsCount: 1,
  //               likesCount: 0,
  //               isLiked: false,
  //             },
  //           },
  //         },
  //       },
  //     }),
  //     apiErrorResponse(
  //       404,
  //       '요청한 리소스를 찾을 수 없음',
  //       notFoundExamples.PostNotFound,
  //     ),
  //     apiErrorResponses(401, '유효하지 않은 토큰', unauthorizedExamples),
  //   ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 수정',
        description: '게시물의 제목/내용/분류를 수정합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiParam({
        name: 'postId',
        required: true,
        description: '게시물 ID',
        schema: { type: 'integer', example: 118 },
      }),
      ApiBody({
        type: UpdatePostRequestDto,
      }),
      apiResponseWithData(
        PostResponseDto,
        200,
        '게시물이 성공적으로 수정되었습니다.',
      ),
      apiErrorResponses(400, '잘못된 요청', badRequestExamples),
      apiErrorResponses(401, '유효하지 않은 토큰', unauthorizedExamples),
      apiErrorResponse(403, '권한 없음', forbiddenExamples.AuthorForbidden),
      apiErrorResponses(404, '요청한 리소스를 찾을 수 없음', notFoundExamples),
    ),

  remove: () =>
    applyDecorators(
      ApiOperation({
        summary: '게시물 삭제',
        description: '게시물을 삭제합니다.',
      }),
      ApiParam({
        name: 'groupId',
        required: true,
        description: '그룹 ID',
        schema: { type: 'integer', example: 15 },
      }),
      ApiParam({
        name: 'postId',
        required: true,
        description: '게시물 ID',
        schema: { type: 'integer', example: 118 },
      }),
      ApiResponse({
        status: 200,
        description: '게시물 삭제 성공',
        content: {
          'application/json': {
            example: {
              status: 'success',
              message: '게시물이 성공적으로 삭제되었습니다.',
              data: null,
            },
          },
        },
      }),
      apiErrorResponses(401, '유효하지 않은 토큰', unauthorizedExamples),
      apiErrorResponse(403, '권한 없음', forbiddenExamples.AuthorForbidden),
      apiErrorResponses(404, '요청한 리소스를 찾을 수 없음', notFoundExamples),
    ),
};
