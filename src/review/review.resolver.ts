import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './review.service';
import { InternalServerErrorException } from '@nestjs/common';
import { reviewResponse } from './models';

@Resolver()
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Mutation(() => reviewResponse)
  async fetchAndUpsertReviewWithLink(
    @Args('reviewLink') reviewLink: string,
    @Args('ignoreCache', { nullable: true }) ignoreCache?: boolean,
  ) {
    try {
      const review = await this.reviewService.fetchAndUpsertReview(
        reviewLink,
        ignoreCache,
      );

      return {
        mainTitle: review.mainTitle,
        releaseYear: review.releaseYear,
        averageRating: review.averageRating,
        id: review.id,
        link: review.link,
        manipulation: this.reviewService.determineManipulation(review),
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Mutation(() => [reviewResponse])
  async fetchAndUpsertReviews(
    @Args('delay') delay: number,
    @Args('fetchingNumber', { type: () => Int, nullable: true })
    fetchingNumber?: number,
    @Args('update', { nullable: true }) update?: boolean,
    @Args('ignoreCache', { nullable: true }) ignoreCache?: boolean,
  ) {
    try {
      const reviews = await this.reviewService.fetchAndUpsertReviews(
        delay,
        fetchingNumber,
        update,
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
