import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: 'success', description: '응답 상태' })
  status: string;

  @ApiProperty({
    example: '요청이 성공적으로 처리되었습니다.',
    description: '응답 메시지',
  })
  message?: string;

  @ApiProperty({
    description: '응답 데이터',
    example: {},
    nullable: true,
  })
  data: T | null;
}
