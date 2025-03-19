import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnApplicationShutdown {
  constructor(private config: ConfigService) {}
  private readonly logger = new Logger(RedisService.name, {
    timestamp: true,
  });
  private client: Redis;

  private init() {
    try {
      this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
      this.logger.log('Redis client connected successfully.');
    } catch (error) {
      this.logger.error('Failed to connect Redis client:', error);
    }
  }

  getCacheClient() {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }

  private async cleanup() {
    if (this.client) {
      try {
        await this.client.quit();
        this.logger.log('Redis client disconnected successfully.');
      } catch (error) {
        this.logger.error('Failed to disconnect Redis client:', error);
      }
    }
  }

  async onApplicationShutdown() {
    await this.cleanup();
  }
}
