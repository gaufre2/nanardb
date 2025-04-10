import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class VideosService {
  nestedConnectOrCreateCutVideos(
    inputs: Prisma.CutVideoCreateWithoutReviewsInput[],
  ): Prisma.CutVideoCreateNestedManyWithoutReviewsInput {
    return {
      connectOrCreate: inputs.map((input) => {
        return {
          where: {
            id: input.id,
          },
          create: input,
        };
      }),
    };
  }

  nestedConnectOrCreateEscaleVideos(
    inputs: Prisma.EscaleVideoCreateWithoutReviewsInput[],
  ): Prisma.EscaleVideoCreateNestedManyWithoutReviewsInput {
    return {
      connectOrCreate: inputs.map((input) => {
        return {
          where: {
            id: input.id,
          },
          create: input,
        };
      }),
    };
  }

  nestedConnectOrCreateNanaroscopeVideos(
    inputs: Prisma.NanaroscopeVideoCreateWithoutReviewsInput[],
  ): Prisma.NanaroscopeVideoCreateNestedManyWithoutReviewsInput {
    return {
      connectOrCreate: inputs.map((input) => {
        return {
          where: {
            seasonEpisodeCode: input.seasonEpisodeCode,
          },
          create: input,
        };
      }),
    };
  }
}
