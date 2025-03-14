import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnApplicationShutdown {
  constructor(private config: ConfigService) {}
  private readonly logger = new Logger(PuppeteerService.name, {
    timestamp: true,
  });
  private browser: puppeteer.Browser;

  async init() {
    this.logger.log('Launching puppeteer browser...');
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

  private async cleanup() {
    if (this.browser && this.browser.connected) {
      try {
        this.logger.log('Closing puppeteer browser...');
        await this.browser.close();
      } catch (error) {
        this.logger.error('Error cleaning up browser: ', error);
      }
    }
  }

  async onApplicationShutdown() {
    await this.cleanup();
  }
}
