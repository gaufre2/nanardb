import { Module } from '@nestjs/common';
import { PuppeteerService } from './puppeteer.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [PuppeteerService, RedisService],
})
export class PuppeteerModule {}
