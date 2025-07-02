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
import { ReviewManipulationEnum } from './models';

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

  async upsertReview(
    where: Prisma.ReviewWhereUniqueInput,
    data: Prisma.ReviewCreateInput,
  ): Promise<Review> {
    return await this.prisma.review.upsert({
      where: {
        link: where.link,
      },
      update: data,
      create: data,
    });
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
    const ratingsCreateManyInput =
      await this.rating.prepareRatingsCreateManyInput(
        rawData.userRatings,
        rawData.link,
      );
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
      ratings: ratingsCreateManyInput,
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

  async filterReviewsLinks(
    reviewsLinks: string[],
    update?: boolean,
  ): Promise<string[]> {
    // Retrieve links of reviews that already exist in the database
    try {
      const existingReviews = await this.prisma.review.findMany({
        select: { link: true },
      });
      const existingLinks = new Set(
        existingReviews.map((review) => review.link),
      );

      // Filter out already inserted links if not updating
      return update
        ? reviewsLinks
        : reviewsLinks.filter((link) => !existingLinks.has(link));
    } catch (error) {
      this.logger.error('Error while checking existing review:', error);
      throw error;
    }
  }

  determineManipulation(review: Review): ReviewManipulationEnum {
    if (review.addedAt.getTime() === review.updatedAt.getTime()) {
      return ReviewManipulationEnum.Inserted;
    } else {
      return ReviewManipulationEnum.Updated;
    }
  }

  async fetchAndCreateReview(
    reviewLink: string,
    ignoreCache?: boolean,
  ): Promise<Review> {
    // Logging
    this.logger.verbose(`Fetching data from "${reviewLink}"`);

    // Fetch review data
    let reviewData;
    try {
      reviewData = await this.nanarland.getReviewData(
        reviewLink,
        ignoreCache ?? false,
      );
    } catch (error) {
      this.logger.error('Error while fetching review:', error);
      throw error;
    }

    // Resolve review relations
    const reviewInput = await this.resolveReviewRelations(reviewData);

    // Get tmdb id
    try {
      reviewInput.tmdbId = await this.tmdb.getMovieId(
        reviewData.mainTitle,
        reviewData.releaseYear,
      );
    } catch (error) {
      this.logger.error('Error while getting TMDb movie Id:', error);
      throw error;
    }

    // Update or create review
    try {
      this.logger.log(`Upserting review: ${reviewInput.mainTitle}`);
      return await this.upsertReview(
        {
          link: reviewInput.link,
        },
        reviewInput,
      );
    } catch (error) {
      this.logger.error('Error while creating review:', error);
      throw error;
    }
  }

  async fetchAndCreateReviews(
    delay: number,
    fetchingNumber: number = Infinity,
    update?: boolean,
    ignoreCache?: boolean,
  ): Promise<Review[]> {
    this.logger.log(
      `Starting review fetch (delay: ${delay}, update: ${String(update)}, ignoreCache: ${String(ignoreCache)})`,
    );

    // Get reviews hrefs
    const reviewsLinks = await this.nanarland.getReviewsLinks(
      ignoreCache ?? false,
    );

    // Retrieve links of reviews that already exist in the database
    const filteredReviewsLinks = await this.filterReviewsLinks(
      reviewsLinks,
      update,
    );

    // Process only filtered review links
    const reviews: Review[] = [];
    for (const reviewLink of filteredReviewsLinks.slice(0, fetchingNumber)) {
      // Fetching and create review
      const review = await this.fetchAndCreateReview(reviewLink, ignoreCache);
      reviews.push(review);

      await this.sleep(delay);
    }
    // Return fetched reviews
    this.logger.log(`Fetched and created ${reviews.length} reviews.`);
    return reviews;
  }
}
