import { Args, Query, Resolver } from '@nestjs/graphql';
import { NanarlandService } from './nanarland.service';

@Resolver()
export class NanarlandResolver {
  constructor(private readonly nanarlandService: NanarlandService) {}

  @Query(() => [String])
  async reviewsHrefs(@Args('ignoreCache') ignoreCache: boolean) {
    return this.nanarlandService.getReviewsHrefs(ignoreCache);
  } // TODO remove, only for test

  @Query(() => String)
  async reviewData(
    @Args('href') href: string,
    @Args('ignoreCache') ignoreCache: boolean,
  ) {
    return JSON.stringify(
      await this.nanarlandService.getReviewData(href, ignoreCache),
    );
  } // TODO remove, only for test
}
