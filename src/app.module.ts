import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { KeysModule } from './modules/keys/keys.module';
import { PaystackModule } from './modules/paystack/paystack.module';
import { AuthModule } from './modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './modules/users/user.entity';
import { Transaction } from './modules/transactions/transaction.entity';
import { Wallet } from './modules/wallet/wallet.entity';
import { DatabaseLogger } from './database/database-logger.service';
import { ApiKey } from './modules/keys/api-key.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Transaction, Wallet, ApiKey],
        synchronize: true, // only for dev
        ssl: {
          rejectUnauthorized: false, // required for Railway
        },
      }),
    }),
    UsersModule,
    WalletModule,
    TransactionsModule,
    KeysModule,
    PaystackModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseLogger],
})
export class AppModule {}
