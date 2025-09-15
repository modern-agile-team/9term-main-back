import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/refresh.guard';
import { PasswordEncoderService } from './password-encoder.service';
import { JwtStrategy } from './strategies/access.strategy';
import { JwtRefreshStrategy } from './strategies/refresh.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './strategies/google.strategy';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
    PassportModule.register({ session: false }),
  ],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    PasswordEncoderService,
    JwtRefreshGuard,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
