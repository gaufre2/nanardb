import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Mutation(() => [String])
  async fetchAndCreateReviews(
    @Args('delay') delay: number,
    @Args('fetchingNumber', { type: () => Int }) fetchingNumber: number,
    @Args('overwrite', { nullable: true }) overwrite?: boolean,
    @Args('ignoreCache', { nullable: true }) ignoreCache?: boolean,
  ) {
    return JSON.stringify(
      await this.reviewService.fetchAndCreateReviews(
        delay,
        fetchingNumber,
        overwrite,
        ignoreCache,
      ),
    );
  }
}
