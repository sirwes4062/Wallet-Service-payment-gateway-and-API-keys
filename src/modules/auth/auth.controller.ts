/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Start Google OAuth flow
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard will redirect to Google automatically
  }

  // Google will redirect here after login
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    // req.user is set by GoogleStrategy (we returned user object)
    return this.authService.login(req.user);
  }
}
