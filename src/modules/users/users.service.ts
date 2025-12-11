import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string) {
    return this.usersRepo.findOne({ where: { googleId } });
  }

  async createFromGoogle(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    const user = this.usersRepo.create({
      googleId: profile.googleId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
    });
    return this.usersRepo.save(user);
  }

  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    let user = await this.findByGoogleId(profile.googleId);
    if (!user) user = await this.findByEmail(profile.email);
    if (!user) user = await this.createFromGoogle(profile);
    else if (!user.googleId) {
      // Link googleId if user existed via email
      user.googleId = profile.googleId;
      await this.usersRepo.save(user);
    }
    return user;
  }
}
