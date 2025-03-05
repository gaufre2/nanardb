import { Injectable } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

const NANARLAND_URL = 'https://www.nanarland.com';

@Injectable()
export class NanarService {
  constructor(private puppeteerService: PuppeteerService) {}

  async getChroniclesHrefs(): Promise<string[]> {
    const browser = await this.puppeteerService.getBrowser();
    const page = await browser.newPage();

    // Open page with all chronicles listed
    await page.goto(`${NANARLAND_URL}/chroniques/toutes-nos-chroniques.html`);

    // Locate chronicles href
    const hrefs = await page.evaluate(() => {
      // html example:
      // <a class="itemFigure titlePrimary" href="/chroniques/nanars-d-action/pur-et-dur/samurai-cop.html" title="SAMURAÏ COP">
      // <a class="itemFigure titlePrimary" href="/chroniques/nanars-martiaux/tatane/karate-contra-mafia-la-chronique-de-nanarland.html" title="KÁRATE CONTRA MAFIA">
      return Array.from(document.querySelectorAll('a.itemFigure.titlePrimary'))
        .map((a) => a.getAttribute('href'))
        .filter((href): href is string => href !== null);
    });

    await page.close();

    return hrefs;
  }
}
