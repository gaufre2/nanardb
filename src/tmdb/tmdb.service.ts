import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MovieDetailsResponseDto, SearchMovieResponseDto } from './dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TmdbService {
  constructor(
    private readonly httpService: HttpService,
    private config: ConfigService,
    private redisService: RedisService,
  ) {}
  private readonly logger = new Logger(TmdbService.name, {
    timestamp: true,
  });
  private TMDB_TOKEN = this.config.getOrThrow<string>('TMDB_TOKEN');
  private BASE_URL = 'https://api.themoviedb.org/3';
  private HEADERS = {
    Authorization: `Bearer ${this.TMDB_TOKEN}`,
    Accept: 'application/json',
  };
  private CACHE_TTL_SEC = 900; // 15 min

  /**
   * Searches for a movie using the provided query, language, and optional year.
   *
   * @param query - The search query string for the movie.
   * @param language - The language for the search results (default is 'fr-FR').
   * @param year - (Optional) The release year of the movie to narrow the search.
   * @returns A promise that resolves to a `SearchMovieResponseDto` containing the search results.
   * @throws `InternalServerErrorException` if an error occurs while fetching movie data.
   */
  private async searchMovie(
    query: string,
    language: string = 'fr-FR',
    year?: number,
  ): Promise<SearchMovieResponseDto> {
    const yearText: string = year ? String(year) : '';
    const url =
      this.BASE_URL +
      '/search/movie' +
      `?query=${encodeURIComponent(query)}` +
      '&include_adult=true' +
      `&language=${encodeURIComponent(language)}` +
      `&year=${encodeURIComponent(yearText)}`;

    this.logger.verbose(`GET ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.HEADERS }),
      );

      this.logger.verbose('Search answer:', response.data);
      return response.data as SearchMovieResponseDto;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching movie data: ${error}`,
      );
    }
  }

  /**
   * Generates a unique cache key for a given endpoint and its parameters.
   *
   * @param endpoint - The API endpoint for which the cache key is being generated.
   * @param params - An array of strings representing the parameters to include in the cache key.
   * @returns A string representing the unique cache key, composed of the service name, endpoint, and parameters.
   */
  private getCacheKey(endpoint: string, params: string[]): string {
    const prefixKey = TmdbService.name.toLowerCase() + `:${endpoint}`;
    const paramsKey = params.map((param) => param).join(':');
    return prefixKey + ':' + paramsKey;
  }

  /**
   * Retrieves the ID of a movie based on a search query and an optional release year.
   *
   * @param query - The search query string for the movie title.
   * @param year - (Optional) The release year of the movie to narrow down the search.
   * @returns A promise that resolves to the movie ID if found.
   * @throws {NotFoundException} If no movie matching the query and optional year is found.
   */
  async getMovieId(query: string, year?: number): Promise<number> {
    const movieId = await this.searchMovie(query, undefined, year);

    if (movieId.results[0]) {
      this.logger.verbose('Movie ID: ' + movieId.results[0].id);
      return movieId.results[0].id;
    }
    throw new NotFoundException(
      `Movie with query "${query}"${year ? ` and year "${year}"` : ''} not found.`,
    );
  }

  /**
   * Fetches detailed movie data from the TMDB API, with optional caching.
   *
   * @param movieId - The unique identifier of the movie to fetch.
   * @param ignoreCache - Optional flag to bypass the cache and fetch fresh data. Defaults to `false`.
   * @param language - The language code for the movie data. Defaults to `'fr-FR'`.
   * @returns A promise that resolves to a `MovieDetailsResponseDto` containing the movie details.
   * @throws `InternalServerErrorException` if an error occurs while fetching the movie data.
   *
   * This method checks the cache for existing data using a generated cache key.
   * If the data is not found in the cache or `ignoreCache` is set to `true`, it fetches the data
   * from the TMDB API. The fetched data is then cached for future requests.
   */
  async getMovieData(
    movieId: number,
    ignoreCache?: boolean,
    language: string = 'fr-FR',
  ): Promise<MovieDetailsResponseDto> {
    const endpoint = 'movie';
    const cacheClient = this.redisService.getCacheClient();
    const cacheKey = this.getCacheKey(endpoint, [String(movieId), language]);

    if (!ignoreCache) {
      const cacheValue = await cacheClient.get(cacheKey);
      if (cacheValue) {
        this.logger.verbose('Cached value returned, key: ' + cacheKey);
        return JSON.parse(cacheValue) as MovieDetailsResponseDto;
      }
    } else {
      this.logger.verbose('Ignoring cached value.');
    }

    const appendToResponse =
      'alternative_titles,' + 'credits,' + 'keywords,' + 'release_dates';
    const url =
      this.BASE_URL +
      `/${endpoint}/${encodeURIComponent(movieId)}` +
      `?append_to_response=${encodeURIComponent(appendToResponse)}` +
      `&language=${encodeURIComponent(language)}`;

    this.logger.debug(`GET ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.HEADERS }),
      );

      this.logger.verbose('Movie details answer:', response.data);

      await cacheClient.setex(
        cacheKey,
        this.CACHE_TTL_SEC,
        JSON.stringify(response.data),
      );
      return response.data as MovieDetailsResponseDto;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching movie data: ${error}`,
      );
    }
  }
}
