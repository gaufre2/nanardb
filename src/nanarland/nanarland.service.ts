import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Page } from 'puppeteer';
import { RarityRanting } from 'src/common/dto';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { ChronicleDto, GenreDto, UserRatingDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
/**
 * The `NanarlandService` class provides methods to scrape and retrieve information from the Nanarland website.
 * It uses Puppeteer to navigate and extract data from the website's chronicle pages.
 *
 * @class
 * @classdesc This service is responsible for fetching and processing chronicle data from Nanarland.
 *
 * @param {PuppeteerService} puppeteerService - The Puppeteer service used for web scraping.
 *
 * @method getChroniclesHrefs - Fetches the hrefs of all chronicles from the Nanarland URL.
 * @method getChronicleData - Retrieves the chronicle details from the given href.
 */
export class NanarlandService {
  constructor(
    private config: ConfigService,
    private puppeteerService: PuppeteerService,
  ) {}
  private readonly logger = new Logger(NanarlandService.name, {
    timestamp: true,
  });
  private BASE_URL = this.config.getOrThrow<string>('NANARLAND_BASE_URL');
  private CACHE_TTL_SEC = 3600; // 1 h

  /**
   * Retrieves the text content of info paragraphs from the chronicle page.
   *
   * @param page - The Puppeteer Page object from a Nanarland chronicle page.
   * @returns A promise that resolves to an array of strings representing the paragraph texts.
   */
  private async getInfos(page: Page): Promise<string[]> {
    const infos = await page.$$eval(
      'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-8.col-lg-8 > p',
      (paragraphs) => paragraphs.map((p) => p.innerText),
    );
    return infos;
  }

  /**
   * Extracts the info text for a given key from the provided info strings.
   *
   * @param key - The key to search for.
   * @param infos - An array of info strings in "key: value" format.
   * @returns The info text associated with the key, or undefined if not found.
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
   * Splits the given text using predefined separators and returns an array of trimmed strings.
   *
   * Predefined separators:
   * - Comma (`,`)
   * - Ampersand (`&`)
   * - Slash (`/`)
   * - The word "et" surrounded by spaces (` et `)
   *
   * @param text - The text to split.
   * @returns An array of trimmed substrings.
   */
  private splitTextWithSeparator(text: string): string[] {
    const REGEX_SEPARATOR = /,|&|\/|\set\s/;
    return text.split(REGEX_SEPARATOR).map((el) => el.trim());
  }

  /**
   * Extracts the last 4-digit year from the given text.
   *
   * @param year - The input text containing the year.
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
   * Converts a duration string to total minutes.
   *
   * @example
   * // returns 150
   * convertToMinutes("2h30")
   * @example
   * // returns 60
   * convertToMinutes("1h")
   * @example
   * // returns 10
   * convertToMinutes("10m")
   * @example
   * // returns 25
   * convertToMinutes("25")
   *
   * @param duration - The duration string (e.g., "2h30", "1h", "10m", "25").
   * @returns The total duration in minutes.
   */
  private convertToMinutes(duration: string): number {
    const hoursMatch = duration.match(/(\d+)h/);
    const minutesMatch = duration.match(/(\d+)(m|$)/);

    const hours = hoursMatch ? parseInt(hoursMatch[0], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[0], 10) : 0;

    return hours * 60 + minutes; // Convert to total minutes
  }

  /**
   * Extracts the rarity rating from the provided text.
   *
   * @param rating - The text containing the rarity rating in the format "some text / rarity".
   * @returns The corresponding RarityRanting enum value.
   * @throws InternalServerErrorException if the rating is invalid or the text format is incorrect.
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

  /**
   * Converts a URL into a cache key by removing protocol/domain, stripping the '.html' extension, and replacing slashes with colons.
   *
   * The method performs the following transformations:
   * - Removes the protocol and domain name from the URL.
   * - Strips the `.html` extension if present.
   * - Replaces all slashes (`/`) with colons (`:`).
   *
   * @example
   * // returns '{servicename}:chroniques:nanars-a-main-armee:espionnage:007-rien-n-est-impossible'
   * convertUrlToCacheKey('https://www.nanarland.com/chroniques/nanars-a-main-armee/espionnage/007-rien-n-est-impossible.html')
   *
   * @param url - The URL to convert.
   * @returns The cache key as a string, prefixed with the service name.
   */
  private convertUrlToCacheKey(url: string): string {
    const editedUrl = url
      .replace(/^(\w+:\/\/)?.*?\//, '') // Remove protocol and domain name
      .replace(/\.html$/, '') // Remove .html extension
      .replace(/\//g, ':'); // Replace slashes with colons

    return NanarlandService.name.toLowerCase() + ':' + editedUrl;
  }

  /**
   * Retrieves a list of chronicle URLs from the specified page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to an array of strings representing the chronicle URLs.
   * @throws InternalServerErrorException if extraction fails.
   */
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
   * Retrieves the main title text from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to the main title.
   * @throws InternalServerErrorException if the main title is not found.
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

  /**
   * Retrieves the genre or sub-genre details from the specified page using the given selector.
   *
   * @param page - The Puppeteer Page object.
   * @param selector - The CSS selector to locate the genre element.
   * @returns A promise that resolves to a GenreDto containing the genre details.
   * @throws InternalServerErrorException if the genre information is not found.
   */
  private async getGenreOrSubGenre(
    page: Page,
    selector: string,
  ): Promise<GenreDto> {
    try {
      const name = await page.$eval(
        selector,
        (el: HTMLEmbedElement) => el.innerText,
      );
      const link = await page.$eval(selector, (el: HTMLEmbedElement) =>
        el.getAttribute('href'),
      );
      if (!link) {
        throw new InternalServerErrorException(
          `Genre link not found (${page.url()})`,
        );
      }
      const genre: GenreDto = { name: name, link: link };
      return genre;
    } catch (error) {
      throw new InternalServerErrorException(
        `Genre not found (${page.url()}), error: ${error}`,
      );
    }
  }

  /**
   * Retrieves the genre information from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to a GenreDto with genre details.
   */
  private async getGenre(page: Page): Promise<GenreDto> {
    const selector =
      'body > main > div.mainInner > nav > ol > li:nth-child(3) > a';

    return this.getGenreOrSubGenre(page, selector);
  }

  /**
   * Retrieves the sub-genre information from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to a GenreDto with sub-genre details.
   */
  private async getSubGenre(page: Page): Promise<GenreDto> {
    const selector =
      'body > main > div.mainInner > nav > ol > li:nth-child(4) > a';

    return this.getGenreOrSubGenre(page, selector);
  }

  /**
   * Retrieves the creation (publication) year from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to the creation year as a number, or undefined if not available.
   */
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

  /**
   * Retrieves the author's name from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to the author's name.
   * @throws InternalServerErrorException if the author's name is not found.
   */
  private async getAuthorName(page: Page): Promise<string> {
    try {
      const authorName = await page.$eval(
        'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-8.col-lg-8 > div.row.my-3 > div > div > figure > figcaption',
        (el) => el.innerText,
      );
      if (authorName) {
        return authorName;
      } else {
        throw new InternalServerErrorException(
          `Undefined author name (${page.url()})`,
        );
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Author name not found (${page.url()}), error: ${error}`,
      );
    }
  }

  /**
   * Retrieves user ratings from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to an array of UserRatingDto objects containing user ratings.
   * @throws InternalServerErrorException if any required user rating data is missing.
   */
  private async getUserRatings(page: Page): Promise<UserRatingDto[]> {
    try {
      const userRatingMapped = await page.evaluate(() => {
        const userRatings = Array.from(
          document.querySelectorAll('#notes .rating-user'),
        );
        return userRatings.map((userRating) => {
          const username =
            userRating.querySelector('figure figcaption')?.textContent;
          const avatarLink = userRating
            .querySelector('figure img')
            ?.getAttribute('src');
          const rating =
            userRating.querySelector('.data .authorRate')?.textContent;

          if (!username || !avatarLink || !rating) {
            throw new InternalServerErrorException(
              `Invalid user rating data (${page.url()}): username=${username}, avatarLink=${avatarLink}, rating=${rating}`,
            );
          }

          return {
            user: {
              name: username,
              avatarLink: avatarLink,
            },
            rating: parseFloat(rating),
          };
        });
      });
      return userRatingMapped;
    } catch (error) {
      throw new InternalServerErrorException(
        `User rating not found (${page.url()}), error: ${error}`,
      );
    }
  }

  /**
   * Retrieves the original title from the provided info strings.
   *
   * @param infos - An array of info strings.
   * @returns The original title, or undefined if not found.
   */
  private getOriginalTitle(infos: string[]): string | undefined {
    const originalTitle = this.getInfoTextByKey('Titre original', infos);
    if (originalTitle) {
      return originalTitle;
    }
  }

  /**
   * Retrieves the list of directors from the provided info strings.
   *
   * @param infos - An array of info strings.
   * @returns An array of director names.
   */
  private getDirectors(infos: string[]): string[] {
    const directorsText = this.getInfoTextByKey('Réalisateur(s)', infos);
    return this.splitTextWithSeparator(directorsText);
  }

  /**
   * Retrieves alternative titles from the provided info strings.
   *
   * @param infos - An array of info strings.
   * @returns An array of alternative titles, or undefined if none are available.
   */
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

  /**
   * Extracts the release year from the provided info strings.
   *
   * @param infos - An array of info strings.
   * @returns The release year as a number, or undefined if not found.
   */
  private getReleaseYear(infos: string[]): number | undefined {
    const releaseYearText = this.getInfoTextByKey('Année', infos);
    return this.getYearFromText(releaseYearText);
  }

  /**
   * Retrieves the origin countries from the provided info strings.
   *
   * @param infos - An array of info strings.
   * @returns An array of origin country names.
   */
  private getOriginCountries(infos: string[]): string[] {
    const originCountriesText = this.getInfoTextByKey('Nationalité', infos);
    return this.splitTextWithSeparator(originCountriesText);
  }

  /**
   * Retrieves the runtime from the provided info strings and converts it to minutes.
   *
   * @param infos - An array of info strings.
   * @returns The runtime in minutes.
   */
  private getRuntime(infos: string[]): number {
    const runtimeText = this.getInfoTextByKey('Durée', infos);
    return this.convertToMinutes(runtimeText);
  }

  /**
   * Retrieves the poster image URL from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to the URL of the poster image.
   * @throws InternalServerErrorException if the poster is not found.
   */
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

  /**
   * Retrieves the average user rating from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to the average rating value.
   * @throws InternalServerErrorException if the average rating is not found.
   */
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

  /**
   * Retrieves the rarity rating from the chronicle page.
   *
   * @param page - The Puppeteer Page object.
   * @returns A promise that resolves to a RarityRanting value.
   * @throws InternalServerErrorException if the rarity rating is not found.
   */
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
   * Fetches the hrefs of all chronicles from Nanarland, utilizing cache management.
   *
   * @param ignoreCache - A flag to bypass the cache if set to true.
   * @returns A promise that resolves to an array of chronicle href strings.
   */
  async getChroniclesHrefs(ignoreCache: boolean): Promise<string[]> {
    const browser = await this.puppeteerService.getBrowser();
    const page = await browser.newPage();
    const link = `${this.BASE_URL}/chroniques/toutes-nos-chroniques.html`;
    const cacheKey = this.convertUrlToCacheKey(link);

    await this.puppeteerService.loadContentWithCache(
      page,
      link,
      cacheKey,
      this.CACHE_TTL_SEC,
      ignoreCache,
    );

    const hrefs = await this.getChroniclesList(page);
    this.logger.debug('Chronicles href answer:', hrefs);
    await page.close();

    return hrefs;
  }

  /**
   * Retrieves detailed information for a chronicle from its href.
   *
   * @param href - The relative URL of the chronicle.
   * @param ignoreCache - (Optional) A flag to bypass cache if set to true.
   * @returns A promise that resolves to a ChronicleDto containing chronicle details.
   */
  async getChronicleData(
    href: string,
    ignoreCache?: boolean,
  ): Promise<ChronicleDto> {
    const browser = await this.puppeteerService.getBrowser();
    const page = await browser.newPage();
    const link = `${this.BASE_URL}${href}`;
    const cacheKey = this.convertUrlToCacheKey(link);

    await this.puppeteerService.loadContentWithCache(
      page,
      link,
      cacheKey,
      this.CACHE_TTL_SEC,
      ignoreCache,
    );

    const infos = await this.getInfos(page);
    this.logger.debug('Movie Infos:', infos);

    const chronicle = {} as ChronicleDto;
    chronicle.link = link;
    chronicle.mainTitle = await this.getMainTitle(page);
    chronicle.genre = await this.getGenre(page);
    chronicle.subGenre = await this.getSubGenre(page);
    chronicle.createYear = await this.getCreationYear(page);
    chronicle.authorName = await this.getAuthorName(page);
    chronicle.userRatings = await this.getUserRatings(page);
    chronicle.averageRating = await this.getAverageRating(page);
    chronicle.rarityRating = await this.getRarityRating(page);
    chronicle.originalTitle = this.getOriginalTitle(infos);
    chronicle.alternativeTitles = this.getAlternativeTitles(infos);
    chronicle.directors = this.getDirectors(infos);
    chronicle.releaseYear = this.getReleaseYear(infos);
    chronicle.originCountries = this.getOriginCountries(infos);
    chronicle.runtime = this.getRuntime(infos);
    chronicle.posterLink = await this.getPoster(page);

    await page.close();

    this.logger.debug(`${chronicle.mainTitle} data:`, chronicle);
    return chronicle;
  }
}
