/* eslint-disable @typescript-eslint/require-await */
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthTokenResponseDto } from './dto/auth-token-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  buildSuccessResponse,
  apiResponse,
} from '../../common/utils/api-response';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // this is the google oauth2 flow for login
  // Start Google OAuth flow
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google for authentication',
  })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard will redirect to Google automatically
  }

  // Google will redirect here after login
  @ApiOperation({ summary: 'Google OAuth2 callback (returns JWT)' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: AuthTokenResponseDto,
  })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any) {
    // req.user is set by GoogleStrategy (we returned user object)
    return this.authService.login(req.user);
  }

  // to get all the user info from google and return a jwt token for the user
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(): Promise<apiResponse> {
    try {
      const users = await this.authService.findAll();
      return buildSuccessResponse('Users retrieved successfully', users);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string): Promise<apiResponse> {
    try {
      if (!id) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      const user = await this.authService.findOne(id);
      return buildSuccessResponse('User retrieved successfully', user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
