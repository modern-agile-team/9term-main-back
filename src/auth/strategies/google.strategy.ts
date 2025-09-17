import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';

type GoogleEmailLike = { value?: unknown; verified?: unknown };

function isGoogleEmailLike(
  obj: unknown,
): obj is { value: string; verified?: boolean } {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const v = (obj as GoogleEmailLike).value;
  return typeof v === 'string';
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(cfg: ConfigService) {
    const options: StrategyOptions = {
      clientID: cfg.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: cfg.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: cfg.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<{
    provider: OAuthProvider;
    providerId: string;
    email?: string;
    emailVerified: boolean;
    username: string;
    displayName?: string;
  }> {
    try {
      let email: string | undefined;
      let emailVerified = false;

      const emailsAny = profile.emails as unknown;
      if (Array.isArray(emailsAny) && emailsAny.length > 0) {
        const first = emailsAny[0] as unknown;
        if (isGoogleEmailLike(first)) {
          const rawEmail = first.value;
          email = rawEmail.trim().toLowerCase();
          if (typeof first.verified === 'boolean') {
            emailVerified = first.verified;
          }
        }
      }

      const jsonUnknown = (profile as unknown as { _json?: unknown })._json;
      if (jsonUnknown && typeof jsonUnknown === 'object') {
        const jsonEmail = (jsonUnknown as { email?: unknown }).email;
        if (!email && typeof jsonEmail === 'string') {
          email = jsonEmail.trim().toLowerCase();
        }
        const jsonVerified = (jsonUnknown as { email_verified?: unknown })
          .email_verified;
        if (typeof jsonVerified === 'boolean' && !emailVerified) {
          emailVerified = jsonVerified;
        }
      }

      const providerId = String(profile.id);
      const displayNameUnknown = (profile as { displayName?: unknown })
        .displayName;
      const displayName =
        typeof displayNameUnknown === 'string'
          ? displayNameUnknown.trim()
          : undefined;

      let username: string;
      if (email) {
        username = email.split('@')[0];
      } else if (displayName && displayName.length > 0) {
        username = displayName.replace(/\s+/g, '.').toLowerCase();
      } else {
        username = providerId;
      }

      username =
        username.replace(/[^a-z0-9.]/gi, '').toLowerCase() || providerId;

      return {
        provider: OAuthProvider.GOOGLE,
        providerId,
        email,
        emailVerified,
        username,
        displayName,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google OAuth profile');
    }
  }
}
