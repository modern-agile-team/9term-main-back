import { OAuthProvider } from '@prisma/client';

export interface OAuthInput {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}

export interface KakaoProfileJson {
  kakao_account?: {
    email?: string;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
    };
  };
}
