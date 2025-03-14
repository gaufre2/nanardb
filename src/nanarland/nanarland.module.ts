import { Module } from '@nestjs/common';
import { NanarlandService } from './nanarland.service';
import { NanarlandResolver } from './nanarland.resolver';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Module({
  providers: [NanarlandService, NanarlandResolver, PuppeteerService],
})
export class NanarlandModule {}
