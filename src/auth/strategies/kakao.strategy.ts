import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { OAuthProvider } from '@prisma/client';
import { OAuthInput } from 'src/auth/interfaces/oauth.interface';
import { KakaoProfileJson } from 'src/auth/interfaces/oauth.interface';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly logger = new Logger(KakaoStrategy.name);

  constructor(cfg: ConfigService) {
    super({
      clientID: cfg.getOrThrow<string>('KAKAO_CLIENT_ID'),
      clientSecret: cfg.get<string>('KAKAO_CLIENT_SECRET'),
      callbackURL: cfg.getOrThrow<string>('KAKAO_CALLBACK_URL'),
    });
  }

  protected authorizationParams(): Record<string, string> {
    return { scope: 'account_email profile_nickname' };
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<OAuthInput> {
    try {
      return this.parseKakaoProfile(profile);
    } catch (err) {
      this.logger.error(
        `[validate] profile parse error (id: ${profile?.id ?? 'unknown'})`,
        err instanceof Error ? err.stack : JSON.stringify(err),
      );
      throw err instanceof TypeError || err instanceof SyntaxError
        ? new UnauthorizedException('Invalid Kakao OAuth profile')
        : new InternalServerErrorException('Kakao OAuth 처리 중 오류');
    }
  }

  private parseKakaoProfile(profile: Profile): OAuthInput {
    if (!profile || profile.id == null) {
      throw new TypeError('Missing profile.id');
    }
    const json = (profile as unknown as { _json?: KakaoProfileJson })._json;
    const kakaoAccount = json?.kakao_account;

    const email = kakaoAccount?.email?.trim().toLowerCase();
    const emailVerified = kakaoAccount?.is_email_verified ?? false;
    const providerId = String(profile.id);
    let displayName: string | undefined;

    const nickname = kakaoAccount?.profile?.nickname;
    if (typeof nickname === 'string') {
      const trimmed = nickname.trim();
      displayName = trimmed.length > 0 ? trimmed : undefined;
    }

    if (!displayName) {
      const fallback = (profile as { displayName?: unknown }).displayName;
      if (typeof fallback === 'string') {
        const trimmed = fallback.trim();
        displayName = trimmed.length > 0 ? trimmed : undefined;
      }
    }

    return {
      provider: OAuthProvider.KAKAO,
      providerId,
      email,
      emailVerified,
      displayName,
    };
  }
}
