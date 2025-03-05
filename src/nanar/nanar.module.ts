import { Module } from '@nestjs/common';
import { NanarService } from './nanar.service';
import { NanarResolver } from './nanar.resolver';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Module({
  providers: [NanarService, NanarResolver, PuppeteerService],
})
export class NanarModule {}
