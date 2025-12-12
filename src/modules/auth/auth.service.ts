import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return {
      message: 'Login successful',
      user,
      access_token: token,
    };
  }

  async addGoogleId(userId: string, googleId: string) {
    await this.userRepo.update({ id: userId }, { googleId });

    const updatedUser = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'googleId',
        'firstName',
        'lastName',
        'picture',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  }

  // async createFromGoogle(userData: {
  //   email: string;
  //   fullName: string;
  //   googleId: string;
  //   profileImage?: string;
  // }) {
  //   try {
  //     // Validate input data
  //     if (!userData.email || !userData.fullName || !userData.googleId) {
  //       throw new Error('Missing required user data from Google');
  //     }

  //     // Check if user already exists with this email
  //     const existingUser = await this.user.findUnique({
  //       where: { email: userData.email },
  //     });

  //     if (existingUser) {
  //       throw new Error('User with this email already exists');
  //     }

  //     // Check if user already exists with this Google ID
  //     const existingGoogleUser = await this.user.findUnique({
  //       where: { googleId: userData.googleId },
  //     });

  //     if (existingGoogleUser) {
  //       throw new Error('User with this Google account already exists');
  //     }

  //     const newUser = await this.user.create({
  //       data: {
  //         email: userData.email,
  //         fullName: userData.fullName,
  //         googleId: userData.googleId,
  //         profileImage: userData.profileImage,
  //       },
  //     });

  //     const { password, ...result } = newUser;
  //     return result;
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       throw new Error(`Failed to create user from Google: ${error.message}`);
  //     }
  //     throw new Error('Failed to create user from Google');
  //   }
  // }

  async findAll() {
    return await this.userRepo.find({
      select: {
        id: true,
        email: true,
        googleId: true,
        firstName: true,
        lastName: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleId: true,
        picture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
