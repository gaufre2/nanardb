import { Module } from '@nestjs/common';
import { NanarlandService } from './nanarland.service';
import { NanarlandResolver } from './nanarland.resolver';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { RedisService } from 'src/redis/redis.service';

@Module({
  providers: [
    NanarlandService,
    NanarlandResolver,
    PuppeteerService,
    RedisService,
  ],
})
export class NanarlandModule {}
