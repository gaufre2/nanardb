import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Review } from '@prisma/client';
import { ImageService, PrismaService } from 'src/common';
import { GenresService } from 'src/genres/genres.service';
import { NanarlandService } from 'src/nanarland/nanarland.service';
import { RatingService } from 'src/rating/rating.service';
import { UserService } from 'src/user/user.service';
import { VideosService } from 'src/videos/videos.service';
import { ReviewRawDto } from './dto';
import { PosterService } from 'src/poster/poster.service';
import { TmdbService } from 'src/tmdb/tmdb.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,
    private readonly nanarland: NanarlandService,
    private readonly tmdb: TmdbService,
    private readonly videos: VideosService,
    private readonly rating: RatingService,
    private readonly genres: GenresService,
    private readonly user: UserService,
    private readonly poster: PosterService,
  ) {}
  private readonly logger = new Logger(ReviewService.name);

  async findReview(
    where: Prisma.ReviewWhereUniqueInput,
  ): Promise<Review | null> {
    return await this.prisma.review.findUnique({ where });
  }
  async findReviews(where: Prisma.ReviewWhereInput): Promise<Review[] | null> {
    return await this.prisma.review.findMany({ where });
  }

  async createReview(data: Prisma.ReviewCreateInput): Promise<Review> {
    return await this.prisma.review.create({ data });
  }

  private sleep(delay: number): Promise<void> {
    this.logger.verbose(`Waiting ${delay}ms before next fetching`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async resolveReviewRelations(
    rawData: ReviewRawDto,
  ): Promise<Prisma.ReviewCreateInput> {
    let authorAvatar = null;
    if (rawData.author.avatarLink) {
      authorAvatar = await this.image.fetchImage(rawData.author.avatarLink);
    }
    const author: Prisma.UserCreateWithoutRatingsInput = {
      username: rawData.author.username,
      avatar: authorAvatar,
    };
    const authorConnectOrCreateInput =
      this.user.prepareUserConnectOrCreateInput(author);
    const ratingsConnectOrCreateInput =
      await this.rating.prepareRatingsConnectOrCreateInput(rawData.userRatings);
    const subgenreConnectOrCreateNestedGenreInput =
      this.genres.prepareSubgenreConnectOrCreateNestedGenreInput(
        rawData.subgenre,
        rawData.genre,
      );
    const cutVideosConnectOrCreateInput =
      this.videos.prepareCutVideosConnectOrCreateInput(rawData.cutVideos);
    const escaleVideosConnectOrCreateInput =
      this.videos.prepareEscaleVideosConnectOrCreateInput(rawData.escaleVideos);
    const nanaroscopeVideosConnectOrCreateInput =
      this.videos.prepareNanaroscopeVideosConnectOrCreateInput(
        rawData.nanaroscopeVideos,
      );
    const savedPosterFilename = await this.poster.fetchAndSavePoster(
      rawData.posterLink,
    );

    const review: Prisma.ReviewCreateInput = {
      link: rawData.link,
      createYear: rawData.createYear,
      author: authorConnectOrCreateInput,
      ratings: ratingsConnectOrCreateInput,
      averageRating: rawData.averageRating,
      rarity: rawData.rarityRating,
      subgenre: subgenreConnectOrCreateNestedGenreInput,
      mainTitle: rawData.mainTitle,
      originalTitle: rawData.originalTitle,
      alternativeTitles: rawData.alternativeTitles,
      directors: rawData.directors,
      releaseYear: rawData.releaseYear,
      originCountries: rawData.originCountries,
      runtime: rawData.runtime,
      cutVideos: cutVideosConnectOrCreateInput,
      escaleVideos: escaleVideosConnectOrCreateInput,
      nanaroscopeVideos: nanaroscopeVideosConnectOrCreateInput,
      posterFilename: savedPosterFilename,
    };
    return review;
  }

  async fetchAndCreateReview(
    reviewLink: string,
    ignoreCache?: boolean,
  ): Promise<Review> {
    // Logging
    this.logger.verbose(`Fetching data from "${reviewLink}"`);

    // Fetch review data
    const reviewData = await this.nanarland.getReviewData(
      reviewLink,
      ignoreCache ?? false,
    );

    // Resolve review relations
    const reviewCreateInput = await this.resolveReviewRelations(reviewData);

    // Get tmdb id
    reviewCreateInput.tmdbId = await this.tmdb.getMovieId(
      reviewData.mainTitle,
      reviewData.releaseYear,
    );

    // Create review
    return await this.createReview(reviewCreateInput);
  }

  async fetchAndCreateReviews(
    delay: number,
    fetchingNumber: number = Infinity,
    overwrite?: boolean,
    ignoreCache?: boolean,
  ): Promise<Review[]> {
    // Get reviews hrefs
    const reviewsLinks = await this.nanarland.getReviewsLinks(
      ignoreCache ?? false,
    );

    // Looping all reviews
    let fetchedReview = 0;
    const reviews: Review[] = [];
    for (const reviewLink of reviewsLinks) {
      try {
        // Skip review if already exist and not overwrite
        const existingReview = await this.findReview({ link: reviewLink });
        if (existingReview && !overwrite) {
          this.logger.verbose(
            `Skipping existing review: "${existingReview.mainTitle}"`,
          );
          continue;
        }
      } catch (error) {
        this.logger.error('Error while checking existing review:', error);
        throw error;
      }

      if (fetchedReview < fetchingNumber) {
        // Fetching and create review
        const review = await this.fetchAndCreateReview(reviewLink, ignoreCache);
        reviews.push(review);

        fetchedReview++;
        await this.sleep(delay);
      } else {
        this.logger.log(`Finished: ${reviews.length} reviews fetched.`);
        break;
      }
    }
    // Return fetched reviews
    return reviews;
  }
}
