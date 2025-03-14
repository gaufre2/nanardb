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

@Injectable()
export class TmdbService {
  constructor(
    private readonly httpService: HttpService,
    private config: ConfigService,
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

  async getMovieData(
    movieId: number,
    language: string = 'fr-FR',
  ): Promise<MovieDetailsResponseDto> {
    const appendToResponse =
      'alternative_titles,' + 'credits,' + 'keywords,' + 'release_dates';
    const url =
      this.BASE_URL +
      `/movie/${encodeURIComponent(movieId)}` +
      `?append_to_response=${encodeURIComponent(appendToResponse)}` +
      `&language=${encodeURIComponent(language)}`;

    this.logger.verbose(`GET ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.HEADERS }),
      );

      this.logger.verbose('Movie details answer:', response.data);
      return response.data as MovieDetailsResponseDto;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error fetching movie data: ${error}`,
      );
    }
  }
}
