import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../keys/api-key.entity';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  providers: [KeysService],
  controllers: [KeysController],
  exports: [KeysService], // Needed for middleware
})
export class KeysModule {}
