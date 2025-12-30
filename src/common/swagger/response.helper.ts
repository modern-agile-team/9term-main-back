// swagger/response.ts
import { ApiResponse } from '@nestjs/swagger';

export interface SwaggerErrorExample {
  message: string | string[];
  error: string;
  statusCode: number;
}

export const apiErrorResponse = (
  status: number,
  description: string,
  example: SwaggerErrorExample,
) =>
  ApiResponse({
    status,
    description,
    content: {
      'application/json': {
        example,
      },
    },
  });

// 예외가 여러 개일 때 → examples (dropdown)
export const apiErrorResponses = (
  status: number,
  description: string,
  examples: Record<string, SwaggerErrorExample>,
) =>
  ApiResponse({
    status,
    description,
    content: {
      'application/json': {
        examples: Object.fromEntries(
          Object.entries(examples).map(([key, value]) => [key, { value }]),
        ),
      },
    },
  });
