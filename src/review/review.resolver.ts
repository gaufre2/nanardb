import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { InternalServerErrorException } from '@nestjs/common';
import { reviewResponse } from './models';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Mutation(() => [String])
  async fetchAndCreateReviewWithLink(
    @Args('reviewLink') reviewLink: string,
    @Args('ignoreCache', { nullable: true }) ignoreCache?: boolean,
  ) {
    try {
      return JSON.stringify(
        await this.reviewService.fetchAndCreateReview(reviewLink, ignoreCache),
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Mutation(() => [reviewResponse])
  async fetchAndCreateReviews(
    @Args('delay') delay: number,
    @Args('fetchingNumber', { type: () => Int, nullable: true })
    fetchingNumber?: number,
    @Args('overwrite', { nullable: true }) overwrite?: boolean,
    @Args('ignoreCache', { nullable: true }) ignoreCache?: boolean,
  ) {
    try {
      const reviews = await this.reviewService.fetchAndCreateReviews(
        delay,
        fetchingNumber,
        overwrite,
        ignoreCache,
      );

      return reviews.map((review) => {
        return {
          mainTitle: review.mainTitle,
          releaseYear: review.releaseYear,
          averageRating: review.averageRating,
          id: review.id,
          link: review.link,
          manipulation: this.reviewService.determineManipulation(review),
        };
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
