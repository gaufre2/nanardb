import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { TmdbService } from './tmdb.service';

@Resolver()
export class TmdbResolver {
  constructor(private readonly tmdbService: TmdbService) {}

  @Query(() => Int)
  async movieId(
    @Args('query') query: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
  ) {
    return await this.tmdbService.getMovieId(query, year);
  } // TODO remove, only for test

  @Query(() => String)
  async movieData(
    @Args('movieId', { type: () => Int }) movieId: number,
    @Args('ignoreCache') ignoreCache: boolean,
    @Args('language', { nullable: true }) language?: string,
  ) {
    return JSON.stringify(
      await this.tmdbService.getMovieData(movieId, ignoreCache, language),
    );
  } // TODO remove, only for test
}
