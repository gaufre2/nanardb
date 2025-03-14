import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { RarityRanting } from 'src/common/dto';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { ChronicleDto } from './dto';

const NANARLAND_URL = 'https://www.nanarland.com';

@Injectable()
export class NanarlandService {
  constructor(private puppeteerService: PuppeteerService) {}
  private readonly logger = new Logger(NanarlandService.name, {
    timestamp: true,
  });

  /**
   * Retrieves text information from infos paragraphs on chronicle page.
   *
   * @param page - The Puppeteer Page object from a nanarland.com/chroniques.
   * @returns A promise that resolves to an array of strings, each containing the text content of a paragraph.
   */
  private async getInfos(page: Page): Promise<string[]> {
    const infos = await page.$$eval(
      'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-8.col-lg-8 > p',
      (paragraphs) => paragraphs.map((p) => p.innerText),
    );
    return infos;
  }

  /**
   * Retrieves the information text associated with a given key from an array of info strings.
   *
   * @param key - The key to search for in the info strings.
   * @param infos - An array of info strings, each in the format "key: value".
   * @returns The information text associated with the given key, or undefined if the key is not found.
   */
  private getInfoTextByKey(key: string, infos: string[]): string {
    const infoMap: { [key: string]: string } = {};

    for (const info of infos) {
      const [key, ...value] = info.split(':');
      if (key && value.length > 0) {
        infoMap[key.trim()] = value.join().trim();
      }
    }

    return infoMap[key];
  }

  /**
   * Splits the given text using a predefined set of separators and trims each resulting element.
   *
   * The separators used are:
   * - Comma (`,`)
   * - Ampersand (`&`)
   * - Slash (`/`)
   * - The word "et" surrounded by spaces (` et `)
   *
   * @param text - The input string to be split.
   * @returns An array of trimmed strings obtained by splitting the input text.
   */
  private splitTextWithSeparator(text: string): string[] {
    const REGEX_SEPARATOR = /,|&|\/|\set\s/;
    return text.split(REGEX_SEPARATOR).map((el) => el.trim());
  }

  /**
   * Extracts the last 4-digit year from a given string.
   *
   * @param year - The string containing the year information.
   * @returns The extracted year as a number, or undefined if no valid year is found.
   */
  private getYearFromText(year: string): number | undefined {
    const REGEX_YEAR = /(\d{4})/g;
    const yearMatch = year.match(REGEX_YEAR);
    if (yearMatch) {
      return parseInt(yearMatch[yearMatch.length - 1], 10);
    }
  }

  /**
   * Converts a duration string to the total number of minutes.
   *
   * The duration string can include hours and minutes in the format "XhY" where X is the number of hours
   * and Y is the number of minutes.
   * Supported format:
   *  - "2h30"  -> 150 minutes
   *  - "2h12m" -> 132 minutes
   *  - "1h"    -> 60 minutes
   *  - "10m"   -> 10 minutes
   *  - "25"    -> 25 minutes
   *
   * @param duration - The duration string to convert, e.g., "2h30".
   * @returns The total number of minutes represented by the duration string.
   */
  private convertToMinutes(duration: string): number {
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)(m|$)/);

    const hours = hoursMatch ? parseInt(hoursMatch[0], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[0], 10) : 0;

    return hours * 60 + minutes; // Convert to total minutes
  }

  /**
   * Extracts the rarity rating from a given text string.
   *
   * @param rating - The text string containing the rarity rating, expected to be in the format "some text / rarity".
   * @returns The corresponding `RarityRanting` enum value.
   * @throws {InternalServerErrorException} If the rarity rating is invalid or the text format is incorrect.
   */
  private getRarityFromText(rating: string): RarityRanting {
    const REGEX_RATING = /\/\s*(.+)/;
    const match = rating.match(REGEX_RATING);

    if (match && match[1]) {
      const rarityString = match[1].trim();

      const rarityMap: { [key: string]: RarityRanting } = {
        Courant: RarityRanting.COMMON,
        Trouvable: RarityRanting.FINDABLE,
        Rare: RarityRanting.RARE,
        Exotique: RarityRanting.EXOTIC,
        'Pièce de Collection': RarityRanting.COLLECTORS_ITEM,
        Introuvable: RarityRanting.UNFINDABLE,
        'Jamais Sorti': RarityRanting.NEVER_RELEASED,
      };

      const rarity = rarityMap[rarityString];
      if (!rarity) {
        throw new InternalServerErrorException(
          `Invalid rarity rating: ${rarityString}`,
        );
      }
      return rarity;
    }
    throw new InternalServerErrorException(`Invalid rarity text: ${rating}`);
  }

  private async getChroniclesList(page: Page): Promise<string[]> {
    try {
      return await page.$$eval('a.itemFigure.titlePrimary', (anchors) =>
        anchors
          .map((a) => a.getAttribute('href'))
          .filter((href) => href !== null),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve chronicles list (${page.url()}), error: ${error}`,
      );
    }
  }

  /**
   * Retrieves the main title from the given chronicle.
   *
   * @param {Page} page - The chronicle page object to extract the main title from.
   * @returns {Promise<string>} A promise that resolves to the main title text.
   * @throws {InternalServerErrorException} If the main title is not found on the page.
   */
  private async getMainTitle(page: Page): Promise<string> {
    try {
      return await page.$eval('h1.mainTitle', (el) => el.innerText);
    } catch (error) {
      throw new InternalServerErrorException(
        `Main title not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private GENRE_SELECTOR =
    'body > main > div.mainInner > nav > ol > li:nth-child(3) > a';

  private async getGenre(page: Page): Promise<string> {
    try {
      return await page.$eval(
        this.GENRE_SELECTOR,
        (el: HTMLEmbedElement) => el.innerText,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Genre name not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private async getGenreHref(page: Page): Promise<string> {
    try {
      const href = await page.$eval(
        this.GENRE_SELECTOR,
        (el: HTMLEmbedElement) => el.getAttribute('href'),
      );
      if (href) {
        return href;
      }
      throw new InternalServerErrorException(
        `Genre name not found (${page.url()})`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Genre name not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private SUBGENRE_SELECTOR =
    'body > main > div.mainInner > nav > ol > li:nth-child(4) > a';

  private async getSubGenre(page: Page): Promise<string> {
    try {
      return await page.$eval(
        this.GENRE_SELECTOR,
        (el: HTMLEmbedElement) => el.innerText,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Sub genre name not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private async getSubGenreHref(page: Page): Promise<string> {
    try {
      const href = await page.$eval(
        this.GENRE_SELECTOR,
        (el: HTMLEmbedElement) => el.getAttribute('href'),
      );
      if (href) {
        return href;
      }
      throw new InternalServerErrorException(
        `Sub genre name not found (${page.url()})`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Sub genre name not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private async getCreationYear(page: Page): Promise<number | undefined> {
    try {
      const createYearText = await page.$eval(
        'body > main > div.mainInner > div > div:nth-child(1) > small',
        (el) => el.innerText,
      );
      return this.getYearFromText(createYearText);
    } catch {
      this.logger.log(`No publication year available (${page.url()})`);
    }
  }

  private getOriginalTitle(infos: string[]): string | undefined {
    const originalTitle = this.getInfoTextByKey('Titre original', infos);
    if (originalTitle) {
      return originalTitle;
    }
  }
  private getDirectors(infos: string[]): string[] {
    const directorsText = this.getInfoTextByKey('Réalisateur(s)', infos);
    return this.splitTextWithSeparator(directorsText);
  }

  private getAlternativeTitles(infos: string[]): string[] | undefined {
    const alternativeTitlesText = this.getInfoTextByKey(
      'Titre(s) alternatif(s)',
      infos,
    );
    const NONE_PLACE_HOLDER = 'Aucun';
    if (alternativeTitlesText !== NONE_PLACE_HOLDER) {
      return this.splitTextWithSeparator(alternativeTitlesText);
    }
  }

  private getReleaseYear(infos: string[]): number | undefined {
    const releaseYearText = this.getInfoTextByKey('Année', infos);
    return this.getYearFromText(releaseYearText);
  }

  private getOriginCountries(infos: string[]): string[] {
    const originCountriesText = this.getInfoTextByKey('Nationalité', infos);
    return this.splitTextWithSeparator(originCountriesText);
  }

  private getRuntime(infos: string[]): number {
    const runtimeText = this.getInfoTextByKey('Durée', infos);
    return this.convertToMinutes(runtimeText);
  }

  private async getPoster(page: Page): Promise<string> {
    try {
      return await page.$eval(
        'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-4.col-lg-4.mb-3.mb-md-0 > img',
        (el) => el.src,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Poster not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private async getAverageRating(page: Page): Promise<number> {
    try {
      const averageRating = await page.$eval(
        '#notes > div.d-inline-block.bg-primary.text-white.font-weight-bold.py-3.px-4.mb-1 > span',
        (el) => el.innerText,
      );
      return parseFloat(averageRating);
    } catch (error) {
      throw new InternalServerErrorException(
        `Average rating not found (${page.url()}), error: ${error}`,
      );
    }
  }

  private async getRarityRating(page: Page): Promise<RarityRanting> {
    try {
      const rarityRating = await page.$eval(
        '#cote-rarete > h3',
        (el) => el.innerText,
      );
      return this.getRarityFromText(rarityRating);
    } catch (error) {
      throw new InternalServerErrorException(
        `Rarity rating not found (${page.url()}), error: ${error}`,
      );
    }
  }

  /**
   * Fetches the hrefs of all chronicles from the nanarland URL.
   *
   * @returns {Promise<string[]>} A promise that resolves to an array of strings, each representing a href of a chronicle.
   */
  async getChroniclesHrefs(): Promise<string[]> {
    const browser = await this.puppeteerService.getBrowser();
    const page = await browser.newPage();

    await page.goto(`${NANARLAND_URL}/chroniques/toutes-nos-chroniques.html`);

    const hrefs = await this.getChroniclesList(page);

    await page.close();

    this.logger.verbose('Chronicles href:', hrefs);
    return hrefs;
  }

  /**
   * Retrieves the chronicle details from the given href.
   *
   * This method uses Puppeteer to navigate to the specified URL and extract various details
   * about the chronicle, such as titles, genres, directors, release year, and ratings.
   *
   * @param href - The relative URL of the chronicle to retrieve.
   * @returns A promise that resolves to a `ChronicleDto` containing the chronicle details.
   */
  async getChronicleData(href: string): Promise<ChronicleDto> {
    const browser = await this.puppeteerService.getBrowser();
    const page = await browser.newPage();

    const chronicle = {} as ChronicleDto;
    chronicle.link = `${NANARLAND_URL}${href}`;

    await page.goto(chronicle.link);

    const infos = await this.getInfos(page);
    this.logger.verbose('Movie Infos:', infos);

    chronicle.mainTitle = await this.getMainTitle(page);
    chronicle.genre = await this.getGenre(page);
    chronicle.genreHref = await this.getGenreHref(page);
    chronicle.subGenre = await this.getSubGenre(page);
    chronicle.subGenreHref = await this.getSubGenreHref(page);
    chronicle.createYear = await this.getCreationYear(page);
    chronicle.originalTitle = this.getOriginalTitle(infos);
    chronicle.alternativeTitles = this.getAlternativeTitles(infos);
    chronicle.directors = this.getDirectors(infos);
    chronicle.releaseYear = this.getReleaseYear(infos);
    chronicle.originCountries = this.getOriginCountries(infos);
    chronicle.runtime = this.getRuntime(infos);
    chronicle.posterLink = await this.getPoster(page);
    chronicle.averageRating = await this.getAverageRating(page);
    chronicle.rarityRating = await this.getRarityRating(page);

    await page.close();

    this.logger.verbose(`${chronicle.mainTitle} data:`, chronicle);
    return chronicle;
  }
}
