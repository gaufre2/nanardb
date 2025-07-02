import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common';
import { UserRatingRawDto } from './dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly user: UserService,
  ) {}
  private readonly logger = new Logger(RatingService.name);

  async deleteManyRating(
    where: Prisma.RatingWhereInput,
  ): Promise<Prisma.BatchPayload | null> {
    return await this.prisma.rating.deleteMany({ where });
  }

  private async prepareRatingCreateInput(
    inputRaw: UserRatingRawDto,
  ): Promise<Prisma.RatingCreateManyReviewInput> {
    return {
      userId: await this.user.upsertUserAndReturnId(inputRaw.user),
      rating: inputRaw.rating,
    };
  }

  async prepareRatingsCreateManyInput(
    inputsRaw: UserRatingRawDto[],
    reviewLink: string,
  ): Promise<Prisma.RatingCreateNestedManyWithoutReviewInput> {
    // Clear precedent ratings
    await this.deleteManyRating({
      review: {
        link: reviewLink,
      },
    });

    // Filter out invalid or missing ratings
    const validRatings = inputsRaw.filter(
      (input) => input.rating && !isNaN(input.rating),
    );

    return {
      createMany: {
        data: await Promise.all(
          validRatings.map((validRating) => {
            return this.prepareRatingCreateInput(validRating);
          }),
        ),
        skipDuplicates: true,
      },
    };
  }
}
