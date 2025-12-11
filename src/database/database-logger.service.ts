import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseLogger implements OnApplicationBootstrap {
  private readonly logger = new Logger('Database');

  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('Database connected successfully!');
      } else {
        await this.dataSource.initialize();
        this.logger.log('Database connected successfully!');
      }
    } catch (error) {
      this.logger.error('Database connection failed!', error.message);
    }
  }
}
