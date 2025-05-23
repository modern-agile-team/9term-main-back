import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
    @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
    @IsString()
    content: string;

    @IsOptional()
    @IsInt()
    parentId?: number | null;
}
