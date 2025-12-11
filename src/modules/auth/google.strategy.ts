import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

/**
 * Google OAuth strategy for authentication
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  /**
   * Validate user from Google profile
   * @param accessToken - Google access token
   * @param refreshToken - Google refresh token
   * @param profile - Google profile information
   */
  // Called by Passport after Google confirms the user
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const googleId = profile.id;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const picture = profile.photos?.[0]?.value;

      // Find or create the user in DB
      const user = await this.usersService.findOrCreateFromGoogle({
        googleId,
        email,
        firstName,
        lastName,
        picture,
      });

      // Passport expects `done(null, user)` or `done(error, null)`
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
}
