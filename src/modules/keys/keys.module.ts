import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../keys/api-key.entity';
import { ApiKeyService } from './keys.service';
import { ApiKeyController } from './keys.controller';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, User]), UsersModule],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, TypeOrmModule], // Needed for middleware
})
export class KeysModule {}
