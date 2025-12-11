import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(user: any) {
    // Choose minimal payload (avoid sensitive info)
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    // Return JSON with token (or redirect to frontend with token)
    return {
      message: 'Login successful',
      user,
      access_token: token,
    };
  }
}
