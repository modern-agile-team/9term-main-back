import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: '요청 처리 상태 (예: success / fail)',
  })
  status: string;

  @ApiProperty({
    description: '응답 메시지',
    example: '요청이 성공적으로 처리되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
    nullable: true,
  })
  data: T;
}
