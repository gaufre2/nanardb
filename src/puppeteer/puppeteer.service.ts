import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import { RedisService } from 'src/common';

@Injectable()
export class PuppeteerService implements OnApplicationShutdown {
  constructor(
    private config: ConfigService,
    private redisService: RedisService,
  ) {}
  private readonly logger = new Logger(PuppeteerService.name);
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

  /**
   * Retrieves the current browser instance. If the browser is not already initialized,
   * it will initialize it by calling the `init` method.
   *
   * @returns A promise that resolves to the browser instance.
   */
  async getBrowser() {
    if (!this.browser) {
      await this.init();
    }
    return this.browser;
  }

  /**
   * Loads webpage content into a Puppeteer page instance, leveraging a caching mechanism
   * to minimize redundant network requests and enhance performance.
   *
   * @param page - The Puppeteer `Page` instance where the content will be loaded.
   * @param url - The URL of the webpage to load if the content is not found in the cache.
   * @param cacheKey - The unique key used to identify the cached content in the Redis cache.
   * @param cacheTtl - (Optional) The time-to-live (TTL) for the cached content in seconds.
   *                   If provided, the cache entry will expire after the specified duration.
   * @param ignoreCache - (Optional) If true, bypasses the cache and fetches fresh content.
   *
   * @remarks
   * - If cached content is available and `ignoreCache` is false, it is directly set on the Puppeteer page.
   * - If no cached content is found or `ignoreCache` is true, the method navigates to the specified URL,
   *   retrieves the page content, and stores it in the cache for future use.
   * - Logs messages for cache usage and when ignoring the cache.
   *
   * @throws Will propagate any errors encountered during Redis operations or Puppeteer actions.
   */
  async loadContentWithCache(
    page: puppeteer.Page,
    url: string,
    cacheKey: string,
    cacheTtl?: number,
    ignoreCache?: boolean,
  ) {
    const cacheClient = this.redisService.getCacheClient();
    let cachedContent = null;
    if (!ignoreCache) {
      cachedContent = await cacheClient.get(cacheKey);
    } else {
      this.logger.verbose('Ignoring cached page content.');
    }

    if (cachedContent && !ignoreCache) {
      this.logger.verbose('Using cached page content, key: ' + cacheKey);
      await page.setContent(cachedContent);
    } else {
      await page.goto(url);
      const content = await page.content();

      await cacheClient.set(cacheKey, content);
      if (cacheTtl) {
        await cacheClient.expire(cacheKey, cacheTtl);
      }
    }
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
