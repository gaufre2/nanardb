import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { InternalServerErrorException } from '@nestjs/common';

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
    try {
      return JSON.stringify(
        await this.reviewService.fetchAndCreateReviews(
          delay,
          fetchingNumber,
          overwrite,
          ignoreCache,
        ),
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
