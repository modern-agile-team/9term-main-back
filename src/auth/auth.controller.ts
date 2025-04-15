import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupdto: SignupDto) {
    await this.authService.signup(signupdto);
    return {
      success: true,
    };
  }

  @Post('login')
  async login(@Body() logindto: LoginDto) {
    const result = await this.authService.login(logindto);
    return {
      token: result.token,
    };
  }
}
