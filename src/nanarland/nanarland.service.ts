import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';
import { ReviewRawDto } from '../review/dto';
import { ConfigService } from '@nestjs/config';
import { parse as parseDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CutVideoRawDto,
  EscaleVideoRawDto,
  NanaroscopeVideoRawDto,
} from 'src/videos/dto';
import { GenreRawDto } from 'src/genres/dto';
import { UserRatingRawDto } from 'src/rating/dto';
import { Rarity } from '@prisma/client';
import { UserRawDto } from 'src/user/dto';

/**
 * The `NanarlandService` class provides methods to scrape and retrieve information from the Nanarland website.
 * It uses Puppeteer to navigate and extract data from the website's review pages.
 *
 * @class
 * @classdesc This service is responsible for fetching and processing review data from Nanarland.
 *
 * @param {PuppeteerService} puppeteer - The Puppeteer service used for web scraping.
 *
 * @method getReviewsLinks - Fetches the links of all reviews from Nanarland.
 * @method getReviewData - Retrieves the review details from the given review link.
 */
@Injectable()
export class NanarlandService {
  constructor(
    private config: ConfigService,
    private puppeteer: PuppeteerService,
  ) {}
  private readonly logger = new Logger(NanarlandService.name);
  private readonly BASE_URL =
    this.config.getOrThrow<string>('NANARLAND_BASE_URL');
  private readonly CACHE_TTL_SEC = 3600; // 1 h

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
   * Fetches the links of all reviews from Nanarland, utilizing cache management.
   *
   * @param ignoreCache - A flag to bypass the cache if set to true.
   * @returns A promise that resolves to an array of review link strings.
   */
  async getReviewsLinks(ignoreCache: boolean): Promise<string[]> {
    const browser = await this.puppeteer.getBrowser();
    const page = await browser.newPage();
    const baseUrl = this.BASE_URL;
    const link = `${baseUrl}/chroniques/toutes-nos-chroniques.html`;
    const cacheKey = this.convertUrlToCacheKey(link);

    /**
     * Retrieves a list of review URLs from the specified page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to an array of strings representing the review URLs.
     * @throws Error if extraction fails.
     */
    async function getReviewsList(page: Page): Promise<string[]> {
      try {
        const hrefs = await page.$$eval(
          'a.itemFigure.titlePrimary',
          (anchors) =>
            anchors
              .map((a) => a.getAttribute('href'))
              .filter((href) => href !== null),
        );

        const links = hrefs.map((href) => {
          return baseUrl + href;
        });
        return links;
      } catch (error) {
        throw new Error(
          `Failed to retrieve reviews list (${link}), error: ${error}`,
        );
      }
    }

    await this.puppeteer.loadContentWithCache(
      page,
      link,
      cacheKey,
      this.CACHE_TTL_SEC,
      ignoreCache,
    );

    const links = await getReviewsList(page);
    this.logger.debug('Reviews links answer:', links);
    await page.close();

    return links;
  }

  /**
   * Retrieves detailed information for a review from its link.
   *
   * @param reviewLink - The link of the review.
   * @param ignoreCache - (Optional) A flag to bypass cache if set to true.
   * @returns A promise that resolves to a ReviewRawDto containing review details.
   */
  async getReviewData(
    reviewLink: string,
    ignoreCache?: boolean,
  ): Promise<ReviewRawDto> {
    const baseUrl = this.BASE_URL;
    const browser = await this.puppeteer.getBrowser();
    const page = await browser.newPage();
    const cacheKey = this.convertUrlToCacheKey(reviewLink);
    const logger = this.logger;

    /**
     * Retrieves the text content of info paragraphs from the review page.
     *
     * @param page - The Puppeteer Page object from a Nanarland review page.
     * @returns A promise that resolves to an array of strings representing the paragraph texts.
     */
    async function getInfos(page: Page): Promise<string[]> {
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
    function getInfoTextByKey(key: string, infos: string[]): string {
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
    function convertToMinutes(duration: string): number {
      const hoursMatch = duration.match(/(\d+)h/);
      const minutesMatch = duration.match(/(\d+)(m|$)/);

      const hours = hoursMatch ? parseInt(hoursMatch[0], 10) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[0], 10) : 0;

      return hours * 60 + minutes; // Convert to total minutes
    }

    /**
     * Extracts the last 4-digit year from the given text.
     *
     * @param year - The input text containing the year.
     * @returns The extracted year as a number, or undefined if no valid year is found.
     */
    function getYearFromText(year: string): number | undefined {
      const REGEX_YEAR = /(\d{4})/g;
      const yearMatch = year.match(REGEX_YEAR);
      if (yearMatch) {
        return parseInt(yearMatch[yearMatch.length - 1], 10);
      }
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
    function splitTextWithSeparator(text: string): string[] {
      const REGEX_SEPARATOR = /,|&|\/|\set\s/;
      return text.split(REGEX_SEPARATOR).map((el) => el.trim());
    }

    /**
     * Extracts the rarity rating from the provided text.
     *
     * @param rating - The text containing the rarity rating in the format "some text / rarity".
     * @returns The corresponding RarityRanting enum value.
     * @throws Error if the rating is invalid or the text format is incorrect.
     */
    function getRarityFromText(rating: string): Rarity {
      const REGEX_RATING = /\/\s*(.+)/;
      const match = rating.match(REGEX_RATING);

      if (match && match[1]) {
        const rarityString = match[1].trim();

        const rarityMap: { [key: string]: Rarity } = {
          Courant: Rarity.COMMON,
          Trouvable: Rarity.FINDABLE,
          Rare: Rarity.RARE,
          Exotique: Rarity.EXOTIC,
          'Pièce de Collection': Rarity.COLLECTORS_ITEM,
          Introuvable: Rarity.UNFINDABLE,
          'Jamais Sorti': Rarity.NEVER_RELEASED,
        };

        const rarity = rarityMap[rarityString];
        if (!rarity) {
          throw new Error(`Invalid rarity rating: ${rarityString}`);
        }
        return rarity;
      }
      throw new Error(`Invalid rarity text: ${rating}`);
    }

    /**
     * Retrieves the main title text from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to the main title.
     * @throws Error if the main title is not found.
     */
    async function getMainTitle(page: Page): Promise<string> {
      try {
        return await page.$eval('h1.mainTitle', (el) => el.innerText);
      } catch (error) {
        throw new Error(
          `Main title not found (${reviewLink}), error: ${error}`,
        );
      }
    }

    /**
     * Retrieves the genre or sub-genre details from the specified page using the given selector.
     *
     * @param page - The Puppeteer Page object.
     * @param selector - The CSS selector to locate the genre element.
     * @returns A promise that resolves to a GenreDto containing the genre details.
     * @throws Error if the genre information is not found.
     */
    async function getGenreOrSubgenre(
      page: Page,
      selector: string,
    ): Promise<GenreRawDto> {
      try {
        const title = await page.$eval(
          selector,
          (el: HTMLEmbedElement) => el.innerText,
        );
        const href = await page.$eval(selector, (el: HTMLEmbedElement) =>
          el.getAttribute('href'),
        );
        if (!href) {
          throw new Error(`Genre link not found (${reviewLink})`);
        }
        const link = baseUrl + href;
        const genre = { title, link };
        return genre;
      } catch (error) {
        throw new Error(`Genre not found (${reviewLink}), error: ${error}`);
      }
    }

    /**
     * Retrieves the genre information from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to a CreateGenreInput with genre details.
     */
    async function getGenre(page: Page): Promise<GenreRawDto> {
      const selector =
        'body > main > div.mainInner > nav > ol > li:nth-child(3) > a';

      return getGenreOrSubgenre(page, selector);
    }

    /**
     * Retrieves the sub-genre information from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to a CreateSubgenreInput with sub-genre details.
     */
    async function getSubgenre(page: Page): Promise<GenreRawDto> {
      const selector =
        'body > main > div.mainInner > nav > ol > li:nth-child(4) > a';

      return getGenreOrSubgenre(page, selector);
    }

    /**
     * Retrieves the creation (publication) year from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to the creation year as a number, or undefined if not available.
     */
    async function getCreationYear(page: Page): Promise<number | undefined> {
      try {
        const createYearText = await page.$eval(
          'body > main > div.mainInner > div > div:nth-child(1) > small',
          (el) => el.innerText,
        );
        return getYearFromText(createYearText);
      } catch {
        logger.verbose(`No publication year available (${reviewLink})`);
      }
    }

    /**
     * Retrieves the author's name from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to the author's name.
     * @throws Error if the author's name is not found.
     */
    async function getAuthor(page: Page): Promise<UserRawDto> {
      const rawAuthor = await page.evaluate(() => {
        const authorSelector =
          'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-8.col-lg-8 > div.row.my-3 > div > div > figure';
        const author = document.querySelector(authorSelector);
        if (!author) {
          throw new Error('Author element not found');
        }
        return {
          username: author.querySelector('figcaption')?.innerText,
          avatarLink: author.querySelector('img')?.getAttribute('src'),
        } as UserRawDto;
      });

      if (!rawAuthor.username || !rawAuthor.avatarLink) {
        throw new Error(`Author datas invalid (${reviewLink})`);
      }
      return rawAuthor;
    }

    /**
     * Retrieves user ratings from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to an array of UserRatingDto objects containing user ratings.
     * @throws Error if any required user rating data is missing.
     */
    async function getUserRatings(page: Page): Promise<UserRatingRawDto[]> {
      const rawUserRatings = await page.evaluate(() => {
        const notes = Array.from(
          document.querySelectorAll('#notes .rating-user'),
        );
        return notes.map((note) => {
          const username = note.querySelector('figure figcaption')?.textContent;
          const avatarLink = note
            .querySelector('figure img')
            ?.getAttribute('src');
          const ratingString =
            note.querySelector('.data .authorRate')?.textContent;

          return {
            user: {
              username,
              avatarLink,
            },
            ratingString,
          };
        });
      });

      const userRatings = rawUserRatings.map((rawUserRating) => {
        if (
          !rawUserRating.user.username ||
          !rawUserRating.user.avatarLink ||
          !rawUserRating.ratingString
        ) {
          throw new Error(
            `Invalid user rating data:\n` +
              `  - user.username=${rawUserRating.user.username}\n` +
              `  - user.avatarLink=${rawUserRating.user.avatarLink}\n` +
              `  - rating=${rawUserRating.ratingString}`,
          );
        }
        const user = {
          username: rawUserRating.user.username,
          avatarLink: rawUserRating.user.avatarLink,
        };
        const rating = parseFloat(rawUserRating.ratingString);

        return {
          user,
          rating,
        };
      });
      return userRatings;
    }

    /**
     * Retrieves the original title from the provided info strings.
     *
     * @param infos - An array of info strings.
     * @returns The original title, or undefined if not found.
     */
    function getOriginalTitle(infos: string[]): string | undefined {
      const originalTitle = getInfoTextByKey('Titre original', infos);
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
    function getDirectors(infos: string[]): string[] {
      const directorsText = getInfoTextByKey('Réalisateur(s)', infos);
      return splitTextWithSeparator(directorsText);
    }

    /**
     * Retrieves alternative titles from the provided info strings.
     *
     * @param infos - An array of info strings.
     * @returns An array of alternative titles, or undefined if none are available.
     */
    function getAlternativeTitles(infos: string[]): string[] | undefined {
      const alternativeTitlesText = getInfoTextByKey(
        'Titre(s) alternatif(s)',
        infos,
      );
      const NONE_PLACE_HOLDER = 'Aucun';
      if (alternativeTitlesText !== NONE_PLACE_HOLDER) {
        return splitTextWithSeparator(alternativeTitlesText);
      }
    }

    /**
     * Extracts the release year from the provided info strings.
     *
     * @param infos - An array of info strings.
     * @returns The release year as a number, or undefined if not found.
     */
    function getReleaseYear(infos: string[]): number | undefined {
      const releaseYearText = getInfoTextByKey('Année', infos);
      return getYearFromText(releaseYearText);
    }

    /**
     * Retrieves the origin countries from the provided info strings.
     *
     * @param infos - An array of info strings.
     * @returns An array of origin country names.
     */
    function getOriginCountries(infos: string[]): string[] {
      const originCountriesText = getInfoTextByKey('Nationalité', infos);
      return splitTextWithSeparator(originCountriesText);
    }

    /**
     * Retrieves the runtime from the provided info strings and converts it to minutes.
     *
     * @param infos - An array of info strings.
     * @returns The runtime in minutes.
     */
    function getRuntime(infos: string[]): number {
      const runtimeText = getInfoTextByKey('Durée', infos);
      return convertToMinutes(runtimeText);
    }

    /**
     * Retrieves and processes a list of cut videos from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to an array of `CutVideoRawDto` containing video detail.
     * @throws Error if any required video data is invalid.
     */
    async function getCutVideos(page: Page): Promise<CutVideoRawDto[]> {
      const rawVideos = await page.evaluate(() => {
        const blockVideos = Array.from(
          document.querySelectorAll('#blockVideos .blockVideo'),
        );
        return blockVideos.map((blockVideo) => {
          const id = blockVideo
            .querySelector('video')
            ?.getAttribute('id')
            ?.match(/\d*$/)?.[0];
          const title = blockVideo.querySelector('.title')?.textContent;
          const averageRating = blockVideo
            .querySelector('.ratingStars')
            ?.getAttribute('data-avg');
          const sources = Array.from(
            blockVideo.querySelectorAll('video source'),
          );
          const links = sources.map((source) => ({
            href: source.getAttribute('src'),
            type: source.getAttribute('type'),
          }));

          return {
            id,
            title,
            averageRating,
            links,
          };
        });
      });

      const videos = rawVideos.map((rawVideo) => {
        if (
          !rawVideo.id ||
          !rawVideo.title ||
          !rawVideo.averageRating ||
          !rawVideo.links.length ||
          rawVideo.links.map((link) => {
            return !link.href || !link.type;
          })
        ) {
          throw new Error(
            `Invalid cut video data (${reviewLink}):\n` +
              `  - id=${rawVideo.id}\n` +
              `  - title=${rawVideo.title}\n` +
              `  - averageRating=${rawVideo.averageRating}\n` +
              `  - links=${JSON.stringify(rawVideo.links)}`,
          );
        }
        const id = parseInt(rawVideo.id);
        const title = rawVideo.title;
        const averageRating = parseFloat(rawVideo.averageRating);
        const links = rawVideo.links.map((link) => ({
          src: baseUrl + link.href,
          type: link.type || 'undefined',
        }));

        return {
          id,
          title,
          averageRating,
          links,
        };
      });

      return videos;
    }

    /**
     * Retrieves and processes a list of "Escale à Nanarland" videos from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to an array of `EscaleVideoRawDto` containing video detail.
     * @throws Error if any required video data is invalid.
     */
    async function getEscaleVideos(page: Page): Promise<EscaleVideoRawDto[]> {
      const rawVideos = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll('#blockEscales .row'),
        );
        return rows.map((row) => {
          const spanTitle = row.querySelector('span')?.innerText;
          const href = row.querySelector('a')?.getAttribute('href');

          return {
            spanTitle,
            href,
          };
        });
      });

      const videos = rawVideos.map((rawVideo) => {
        const idMatch = rawVideo.spanTitle?.match(/N°(\d+)/);
        const id = idMatch ? idMatch[1] : null;

        const titleMatch = rawVideo.spanTitle?.match(/^(.*?)(?=\s*-\s*)/);
        const title = titleMatch ? titleMatch[1].trim() : null;

        const dateMatch = rawVideo.spanTitle?.match(/-\s*(.+)/);
        const dateFrenchString = dateMatch ? dateMatch[1].trim() : null;

        const href = rawVideo.href;

        if (!id || !title || !dateFrenchString || !href) {
          throw new Error(
            `Invalid escale video data (${reviewLink}):\n` +
              `  - spanTitle=${rawVideo.spanTitle}\n` +
              `  - id=${id}\n` +
              `  - title=${title}\n` +
              `  - dateFrenchString=${dateFrenchString}\n` +
              `  - href=${href}\n`,
          );
        }
        const date = parseDate(
          dateFrenchString,
          'EEEE dd MMMM yyyy',
          new Date(),
          { locale: fr },
        );

        return {
          id: parseInt(id),
          title: title,
          pageLink: baseUrl + href,
          publicationDate: date,
        };
      });

      return videos;
    }

    /**
     * Retrieves and processes a list of "Nanaroscope" videos from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to an array of `NanaroscopeVideoRawDto` containing video detail.
     * @throws Error if any required video data is invalid.
     */
    async function getNanaroscopeVideos(
      page: Page,
    ): Promise<NanaroscopeVideoRawDto[]> {
      function extractSeasonEpisodeFromAElement(aTitle: string): string {
        const match = aTitle.match(/Saison\s+(\d+)\s+Episode\s+(\d+)/i);

        if (match) {
          const season = match[1].padStart(2, '0');
          const episode = match[2].padStart(2, '0');
          return `S${season}E${episode}`;
        } else {
          throw new Error(
            `Impossible to extract season episode code (SxxExx): aTitle=${aTitle}`,
          );
        }
      }
      function extractTaglineFromSpanElement(spanTitle: string): string {
        const match = spanTitle.match(/.*:\s*(.+)/);

        if (match) {
          return match[1].trim();
        } else {
          throw new Error(
            `Impossible to extract episode tagline: spanTitle=${spanTitle}`,
          );
        }
      }

      const rawVideos = await page.evaluate(() => {
        const blockVideos = Array.from(
          document.querySelectorAll('#blockNanaroscopes .blockVideo'),
        );

        return blockVideos.map((blockVideo) => {
          const aTitle = blockVideo.querySelector('a')?.getAttribute('title');
          const spanTitle = blockVideo.querySelector('span')?.innerText;

          return {
            aTitle: aTitle,
            spanTitle: spanTitle,
          };
        });
      });

      const videos = rawVideos.map((rawVideo) => {
        if (!rawVideo.aTitle || !rawVideo.spanTitle) {
          throw new Error(
            `Invalid Nanaroscope video data (${reviewLink}):\n` +
              `  - aTitle=${rawVideo.aTitle}\n` +
              `  - spanTitle=${rawVideo.spanTitle}`,
          );
        }
        const seasonEpisodeCode = extractSeasonEpisodeFromAElement(
          rawVideo.aTitle,
        );
        const tagline = extractTaglineFromSpanElement(rawVideo.spanTitle);

        return {
          seasonEpisodeCode,
          tagline,
        };
      });

      return videos;
    }

    /**
     * Retrieves the poster image URL from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to the URL of the poster image.
     * @throws Error if the poster is not found.
     */
    async function getPoster(page: Page): Promise<string> {
      try {
        return await page.$eval(
          'body > main > div.mainInner > div > div:nth-child(1) > div.row > div.col-12.col-md-4.col-lg-4.mb-3.mb-md-0 > img',
          (el) => el.src,
        );
      } catch (error) {
        throw new Error(`Poster not found (${reviewLink}), error: ${error}`);
      }
    }

    /**
     * Retrieves the average user rating from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to the average rating value.
     * @throws Error if the average rating is not found.
     */
    async function getAverageRating(page: Page): Promise<number> {
      try {
        const averageRating = await page.$eval(
          '#notes > div.d-inline-block.bg-primary.text-white.font-weight-bold.py-3.px-4.mb-1 > span',
          (el) => el.innerText,
        );
        return parseFloat(averageRating);
      } catch (error) {
        throw new Error(
          `Average rating not found (${reviewLink}), error: ${error}`,
        );
      }
    }

    /**
     * Retrieves the rarity rating from the review page.
     *
     * @param page - The Puppeteer Page object.
     * @returns A promise that resolves to a Rarity value.
     * @throws Error if the rarity rating is not found.
     */
    async function getRarityRating(page: Page): Promise<Rarity> {
      try {
        const rarityRating = await page.$eval(
          '#cote-rarete > h3',
          (el) => el.innerText,
        );
        return getRarityFromText(rarityRating);
      } catch (error) {
        throw new Error(
          `Rarity rating not found (${reviewLink}), error: ${error}`,
        );
      }
    }

    await this.puppeteer.loadContentWithCache(
      page,
      reviewLink,
      cacheKey,
      this.CACHE_TTL_SEC,
      ignoreCache,
    );

    const infos = await getInfos(page);
    this.logger.debug('Movie Infos:', infos);

    const review = {} as ReviewRawDto;
    review.link = reviewLink;
    review.mainTitle = await getMainTitle(page);
    review.genre = await getGenre(page);
    review.subgenre = await getSubgenre(page);
    review.createYear = await getCreationYear(page);
    review.author = await getAuthor(page);
    review.userRatings = await getUserRatings(page);
    review.averageRating = await getAverageRating(page);
    review.rarityRating = await getRarityRating(page);
    review.originalTitle = getOriginalTitle(infos);
    review.alternativeTitles = getAlternativeTitles(infos);
    review.directors = getDirectors(infos);
    review.releaseYear = getReleaseYear(infos);
    review.originCountries = getOriginCountries(infos);
    review.runtime = getRuntime(infos);
    review.cutVideos = await getCutVideos(page);
    review.escaleVideos = await getEscaleVideos(page);
    review.nanaroscopeVideos = await getNanaroscopeVideos(page);
    review.posterLink = await getPoster(page);

    await page.close();

    this.logger.debug(`${review.mainTitle} data:`, review);
    return review;
  }
}
