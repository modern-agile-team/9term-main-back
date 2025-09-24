import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { OAuthProvider } from '@prisma/client';

export class SocialSignupRequestDto {
  @IsEnum(OAuthProvider)
  provider!: OAuthProvider;

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsString()
  @Length(3, 20)
  @Matches(/^[a-z0-9._-]+$/i, {
    message: 'username은 영문/숫자/._-만 허용됩니다.',
  })
  username!: string;

  @IsString()
  @Length(8, 64)
  password!: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
