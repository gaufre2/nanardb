import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, Rating } from '@prisma/client';
import { ImageService, PrismaService } from 'src/common';
import { UserRatingRawDto } from './dto';

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,
  ) {}
  private readonly logger = new Logger(RatingService.name);

  private async prepareRatingConnectOrCreateInput(
    inputRaw: UserRatingRawDto,
  ): Promise<Prisma.RatingCreateWithoutReviewInput> {
    const avatar = await this.image.fetchImage(inputRaw.user.avatarLink);
    if (!avatar) {
      const errorMessage = `Failed to fetch avatar image for user "${inputRaw.user.username}"`;
      this.logger.error(errorMessage);
      throw new InternalServerErrorException(errorMessage);
    }

    return {
      rating: inputRaw.rating,
      user: {
        connectOrCreate: {
          where: {
            username: inputRaw.user.username,
          },
          create: {
            username: inputRaw.user.username,
            avatar: avatar,
          },
        },
      },
    };
  }

  async prepareRatingsConnectOrCreateInput(
    inputsRaw: UserRatingRawDto[],
  ): Promise<Prisma.RatingCreateNestedManyWithoutReviewInput> {
    // Filter out invalid or missing ratings
    const validRatings = inputsRaw.filter(
      (input) => input.rating && !isNaN(input.rating),
    );

    return {
      create: await Promise.all(
        validRatings.map((validRating) => {
          return this.prepareRatingConnectOrCreateInput(validRating);
        }),
      ),
    };
  }

  async createRatings(data: Prisma.RatingCreateManyInput[]): Promise<Rating[]> {
    return this.prisma.rating.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async deleteRating(
    where: Prisma.RatingWhereUniqueInput,
  ): Promise<Rating | null> {
    return await this.prisma.rating.delete({ where });
  }
}
