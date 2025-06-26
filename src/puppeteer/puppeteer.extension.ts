import * as puppeteer from 'puppeteer';

declare module 'puppeteer' {
  interface Page {
    enableLoadingOptimization(): Promise<void>;
  }
}

/**
 * Enables loading optimization on the current Puppeteer page by intercepting network requests.
 * This method aborts requests for stylesheets, fonts, and images that do not originate from the same origin as the page.
 * The goal is to speed up page loading by preventing unnecessary resources from being downloaded.
 *
 * @returns A promise that resolves when request interception is enabled and the optimization is set up.
 */
puppeteer.Page.prototype.enableLoadingOptimization = async function (
  this: puppeteer.Page,
) {
  const pageOrigin = new URL(this.url()).origin;
  await this.setRequestInterception(true);
  this.on('request', (request) => {
    if (
      request.resourceType() === 'stylesheet' ||
      request.resourceType() === 'font' ||
      (request.resourceType() === 'image' &&
        !request.url().startsWith(pageOrigin))
    ) {
      void request.abort();
    } else {
      void request.continue();
    }
  });
};
