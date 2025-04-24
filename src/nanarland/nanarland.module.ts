import { Module } from '@nestjs/common';
import { NanarlandService } from './nanarland.service';
import { NanarlandResolver } from './nanarland.resolver';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Module({
  providers: [NanarlandService, NanarlandResolver, PuppeteerService],
  exports: [NanarlandService, PuppeteerService],
})
export class NanarlandModule {}
