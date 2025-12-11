import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiRepo: Repository<ApiKey>,
  ) {}

  async createApiKey(userId: string, permissions: string[]) {
    // 1. Ensure user has <= 5 active keys
    const count = await this.apiRepo.count({
      where: { user: { id: userId }, revoked: false },
    });
    if (count >= 5) throw new BadRequestException('Max 5 API keys allowed.');

    // 2. Generate the raw key
    const rawKey = crypto.randomBytes(32).toString('hex');

    // 3. Hash the key before saving
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = this.apiRepo.create({
      key: hashedKey,
      permissions,
      user: { id: userId },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });

    await this.apiRepo.save(apiKey);

    // Return only the raw key ONCE
    return { apiKey: rawKey };
  }

  // made changes here to the return type and logic
  async rolloverKey(apiKeyId: number, userId: string) {
    const oldKey = await this.apiRepo.findOne({
      where: { id: apiKeyId, user: { id: userId } },
    });
    if (!oldKey) throw new BadRequestException('API key not found');

    oldKey.revoked = true;
    await this.apiRepo.save(oldKey);

    // Create new key
    return this.createApiKey(userId, oldKey.permissions);
  }

  async findValidKey(key: string) {
    return this.apiRepo.findOne({
      where: {
        key,
        revoked: false,
        expiresAt: MoreThan(new Date()), // only keys not expired
      },
      relations: ['user'],
    });
  }
}
