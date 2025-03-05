import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleDestroy {
  constructor(private config: ConfigService) {}
  private browser: puppeteer.Browser;

  async init() {
    this.browser = await puppeteer.launch({
      executablePath: this.config.getOrThrow<string>('CHROMIUM_PATH'),
    });
  }

  async getBrowser() {
    if (!this.browser) {
      await this.init();
    }
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
