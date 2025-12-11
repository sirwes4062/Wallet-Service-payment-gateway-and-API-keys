import { Controller, Post, Req, Body, UseGuards } from '@nestjs/common';
import { KeysService } from './keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('keys')
export class KeysController {
  constructor(private keysService: KeysService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createNewKey(@Req() req, @Body('permissions') permissions: string[]) {
    const userId = req.user.sub;
    return this.keysService.createApiKey(userId, permissions);
  }

  @Post('rollover')
  @UseGuards(JwtAuthGuard)
  async rollover(@Req() req, @Body('keyId') keyId: number) {
    return this.keysService.rolloverKey(keyId, req.user.sub);
  }
}
