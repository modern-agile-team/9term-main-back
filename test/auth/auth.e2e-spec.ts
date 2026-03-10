import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { AppModule } from 'src/app.module';
import { AuthService } from 'src/auth/auth.service';
import { GoogleAuthGuard } from 'src/auth/guards/google-auth.guard';
import { KakaoAuthGuard } from 'src/auth/guards/kakao-auth.guard';
import { JwtRefreshGuard } from 'src/auth/guards/refresh.guard';
import { OAuthInput } from 'src/auth/interfaces/oauth.interface';
import * as request from 'supertest';

const createMockAuthGuard = (provider: OAuthInput['provider']) => {
  return class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context
        .switchToHttp()
        .getRequest<Request & { user: OAuthInput }>();
      req.user = {
        provider,
        providerId: `${provider.toLowerCase()}-12345`,
        email: `${provider.toLowerCase()}-test@gmail.com`,
        displayName: `${provider}TestUser`,
      };
      return true;
    }
  };
};

class MockJwtRefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { cookies?: Record<string, string> }>();

    req.cookies = {
      ...req.cookies,
      refresh_token: 'mock-refresh-token',
    };

    return true;
  }
}

const mockTokenResult = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

const mockRefreshTokenResult: Awaited<
  ReturnType<AuthService['refreshAccessToken']>
> = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let oauthLoginSpy: jest.SpiedFunction<AuthService['oauthLogin']>;
  let refreshAccessTokenSpy: jest.SpiedFunction<
    AuthService['refreshAccessToken']
  >;

  const oauthCallbackCases = [
    {
      name: 'google',
      url: '/auth/google/callback',
      expectedUser: {
        provider: 'GOOGLE',
        providerId: 'google-12345',
        email: 'google-test@gmail.com',
        displayName: 'GOOGLETestUser',
      },
    },
    {
      name: 'kakao',
      url: '/auth/kakao/callback',
      expectedUser: {
        provider: 'KAKAO',
        providerId: 'kakao-12345',
        email: 'kakao-test@gmail.com',
        displayName: 'KAKAOTestUser',
      },
    },
  ] as const;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GoogleAuthGuard)
      .useClass(createMockAuthGuard('GOOGLE'))
      .overrideGuard(KakaoAuthGuard)
      .useClass(createMockAuthGuard('KAKAO'))
      .overrideGuard(JwtRefreshGuard)
      .useClass(MockJwtRefreshGuard)
      .compile();

    authService = moduleFixture.get(AuthService);

    oauthLoginSpy = jest
      .spyOn(authService, 'oauthLogin')
      .mockResolvedValue(mockTokenResult);

    refreshAccessTokenSpy = jest
      .spyOn(authService, 'refreshAccessToken')
      .mockResolvedValue(mockRefreshTokenResult);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(() => {
    oauthLoginSpy.mockClear();
    refreshAccessTokenSpy.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  const hasCookie = (res: request.Response, key: string, value: string) => {
    const cookies: string[] = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie']
      : [];

    return cookies.some((cookie) => cookie.startsWith(`${key}=${value}`));
  };

  it.each(oauthCallbackCases)(
    'GET $url 은 refresh_token 쿠키를 설정하고 redirect 한다',
    async ({ url, expectedUser }) => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      const response = await request(server).get(url).expect(302);

      expect(oauthLoginSpy).toHaveBeenCalledWith(expectedUser);
      expect(
        hasCookie(response, 'refresh_token', mockTokenResult.refreshToken),
      ).toBe(true);

      expect(response.headers.location).toContain(
        `/login/success#accessToken=${mockTokenResult.accessToken}`,
      );
    },
  );

  describe('POST /auth/refresh', () => {
    it('refresh_token 쿠키가 있으면 access token을 재발급한다', async () => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      const response = await request(server).post('/auth/refresh').expect(201);

      expect(refreshAccessTokenSpy).toHaveBeenCalledWith(
        mockTokenResult.refreshToken,
      );

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Access Token 재발급에 성공했습니다.');
      expect(response.body.data.accessToken).toBe(
        mockRefreshTokenResult.accessToken,
      );

      expect(
        hasCookie(
          response,
          'refresh_token',
          mockRefreshTokenResult.refreshToken,
        ),
      ).toBe(true);
    });
  });
});
