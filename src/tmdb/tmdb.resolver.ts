import { Args, Query, Resolver } from '@nestjs/graphql';
import { TmdbService } from './tmdb.service';

@Resolver()
export class TmdbResolver {
  constructor(private readonly tmdbService: TmdbService) {}

  @Query(() => Number)
  async movieId(
    @Args('query') query: string,
    @Args('year', { nullable: true }) year?: number,
  ) {
    return await this.tmdbService.getMovieId(query, year);
  } // TODO remove, only for test

  @Query(() => String)
  async movieData(
    @Args('movieId') movieId: number,
    @Args('language', { nullable: true }) language?: string,
  ) {
    return JSON.stringify(
      await this.tmdbService.getMovieData(movieId, language),
    );
  } // TODO remove, only for test
}
