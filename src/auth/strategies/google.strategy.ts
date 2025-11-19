import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';
import { OAuthInput } from 'src/auth/interfaces/oauth.interface';

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
  private readonly logger = new Logger(GoogleStrategy.name);
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
  ): Promise<OAuthInput> {
    try {
      return this.parseGoogleProfile(profile);
    } catch (err) {
      this.logger.error(
        '[validate] profile parse error',
        err instanceof Error ? err.stack : JSON.stringify(err),
      );
      throw err instanceof TypeError || err instanceof SyntaxError
        ? new UnauthorizedException('Invalid Google OAuth profile')
        : new InternalServerErrorException('Google OAuth 처리 중 오류');
    }
  }

  private parseGoogleProfile(profile: Profile): OAuthInput {
    if (!profile || profile.id == null) {
      throw new TypeError('Missing profile.id');
    }
    let email: string | undefined;
    let emailVerified = false;

    const emailsAny = profile.emails as unknown;
    if (Array.isArray(emailsAny) && emailsAny.length > 0) {
      let picked: { value: string; verified?: boolean } | undefined;
      for (const item of emailsAny as unknown[]) {
        if (isGoogleEmailLike(item) && item.verified === true) {
          picked = item;
          break;
        }
      }
      if (!picked) {
        for (const item of emailsAny as unknown[]) {
          if (isGoogleEmailLike(item)) {
            picked = item;
            break;
          }
        }
      }
      if (picked) {
        email = picked.value.trim().toLowerCase();
        if (typeof picked.verified === 'boolean') {
          emailVerified = picked.verified;
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

    return {
      provider: OAuthProvider.GOOGLE,
      providerId,
      email,
      emailVerified,
      displayName,
    };
  }
}
