import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  constructor(private readonly config: ConfigService) {}
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  private init() {
    try {
      this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
      this.logger.log('Redis client connected successfully.');
    } catch (error) {
      this.logger.error('Failed to connect Redis client:', error);
    }
  }

  onModuleInit() {
    this.init();
  }

  /**
   * Retrieves the cache client instance. If the client has not been initialized,
   * it initializes the client before returning it.
   *
   * @returns The initialized cache client instance.
   */
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
