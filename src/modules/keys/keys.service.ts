import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { User } from '../users/user.entity';
import { CreateApiKeyDto, VALID_PERMISSIONS } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-key.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  parseExpiration,
  isValidExpirationFormat,
} from 'src/common/utils/expiration_parse';
import { buildSuccessResponse } from 'src/common/utils/api-response';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ============================================================
  //  CREATE API KEY (TYPEORM VERSION)
  // ============================================================
  async create(createApiKeyDto: CreateApiKeyDto, userId: string) {
    const { name, permissions, expiry } = createApiKeyDto;

    if (!isValidExpirationFormat(expiry)) {
      throw new BadRequestException(
        'Invalid expiry format. Must be one of: 1H, 1D, 1M, 1Y',
      );
    }

    if (!permissions || permissions.length === 0) {
      throw new BadRequestException('Permissions must be explicitly assigned');
    }

    const invalidPermissions = permissions.filter(
      (p) => !VALID_PERMISSIONS.includes(p),
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(', ')}`,
      );
    }

    // Count active keys
    const activeKeysCount = await this.apiKeyRepo.count({
      where: {
        user: { id: userId },
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed per user',
      );
    }

    const rawKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);

    const expiresAt = parseExpiration(expiry);

    // get user entity
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Create entity
    const newKey = this.apiKeyRepo.create({
      name,
      keyHash,
      permissions,
      expiresAt,
      user,
    });

    await this.apiKeyRepo.save(newKey);

    return buildSuccessResponse('API key created successfully', {
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    });
  }

  // ============================================================
  //  ROLLOVER API KEY (TYPEORM VERSION)
  // ============================================================
  async rollover(rolloverDto: RolloverApiKeyDto, userId: string) {
    const { expired_key_id, expiry } = rolloverDto;

    if (!isValidExpirationFormat(expiry)) {
      throw new BadRequestException(
        'Invalid expiry format. Must be one of: 1H, 1D, 1M, 1Y',
      );
    }

    const expiredKey = await this.apiKeyRepo.findOne({
      where: { id: expired_key_id, user: { id: userId } },
    });

    if (!expiredKey) {
      throw new NotFoundException(
        'API key not found or does not belong to this user',
      );
    }

    if (expiredKey.expiresAt > new Date()) {
      throw new BadRequestException('API key has not expired yet');
    }

    const activeKeysCount = await this.apiKeyRepo.count({
      where: {
        user: { id: userId },
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException(
        'Maximum 5 active API keys allowed per user',
      );
    }

    const rawKey = this.generateApiKey();
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = parseExpiration(expiry);

    if (!expiredKey.permissions || expiredKey.permissions.length === 0) {
      throw new BadRequestException(
        'Expired key has no permissions to rollover',
      );
    }

    const invalidPermissions = expiredKey.permissions.filter(
      (p) => !VALID_PERMISSIONS.includes(p),
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Expired key contains invalid permissions: ${invalidPermissions.join(', ')}`,
      );
    }

    // const user = await this.userRepo.findOne({ where: { id: userId } });
    const apiKeyEntity = this.apiKeyRepo.create({
      name: expiredKey.name + '_rollover', // or any name you prefer
      keyHash,
      permissions: expiredKey.permissions,
      expiresAt,
      userId,
    });

    await this.apiKeyRepo.save(apiKeyEntity);

    return buildSuccessResponse('API key rollover successful', {
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    });
  }

  // ============================================================
  //  FIND ALL KEYS
  // ============================================================
  async findAll(userId: string) {
    return this.apiKeyRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'name',
        'permissions',
        'expiresAt',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  // ============================================================
  //  FIND ONE
  // ============================================================
  async findOne(id: string, userId: string) {
    const key = await this.apiKeyRepo.findOne({
      where: { id, user: { id: userId } },
      select: [
        'id',
        'name',
        'permissions',
        'expiresAt',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!key) throw new NotFoundException('API key not found');

    return key;
  }

  // ============================================================
  //  DELETE (DEACTIVATE)
  // ============================================================
  async remove(id: string, userId: string) {
    const apiKey = await this.apiKeyRepo.findOne({
      where: { id, user: { id: userId } },
    });

    if (!apiKey) throw new NotFoundException('API key not found');

    await this.apiKeyRepo.update(apiKey.id, { isActive: false });

    return { message: 'API key deactivated successfully' };
  }

  // ============================================================
  //  GENERATE KEY
  // ============================================================
  private generateApiKey(): string {
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}
