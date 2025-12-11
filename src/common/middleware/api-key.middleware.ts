import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { KeysService } from '../../modules/keys/keys.service';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private keysService: KeysService) {}

  async use(req: any, res: any, next: () => void) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) throw new UnauthorizedException('API key missing');

    const hashed = crypto.createHash('sha256').update(apiKey).digest('hex');

    const validKey = await this.keysService.findValidKey(hashed);
    if (!validKey) throw new UnauthorizedException('Invalid API key');

    req.apiUser = validKey.user;
    req.apiPermissions = validKey.permissions;

    next();
  }
}
