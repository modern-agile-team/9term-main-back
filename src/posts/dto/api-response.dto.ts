import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    example: 'success',
    description: '요청 처리 상태 (예: success / fail)',
  })
  status: string;

  @ApiProperty({
    example: '요청이 성공적으로 처리되었습니다.',
    description: '서버에서 응답한 메시지',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
    nullable: true,
  })
  data: T;
}
