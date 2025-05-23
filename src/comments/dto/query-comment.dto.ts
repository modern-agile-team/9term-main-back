import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class QueryCommentDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    parentId?: number; // 부모 댓글 ID로 필터링
}