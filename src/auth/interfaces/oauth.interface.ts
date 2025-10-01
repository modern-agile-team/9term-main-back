import { OAuthProvider } from '@prisma/client';

export interface OAuthInput {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}
