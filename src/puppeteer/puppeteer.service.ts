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

  private async init() {
    try {
      this.browser = await puppeteer.launch({
        executablePath: this.config.getOrThrow<string>('CHROMIUM_PATH'),
      });
      this.logger.log('Puppeteer browser started successfully.');
    } catch (error) {
      this.logger.error('Failed to start puppeteer browser: ', error);
    }
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
        await this.browser.close();
        this.logger.log('Puppeteer browser closed successfully.');
      } catch (error) {
        this.logger.error('Failed to close puppeteer browser: ', error);
      }
    }
  }

  async onApplicationShutdown() {
    await this.cleanup();
  }
}
