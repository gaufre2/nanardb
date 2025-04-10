import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GenresService {
  prepareSubgenreConnectOrCreateNestedGenreInput(
    inputSubgenre: Prisma.SubgenreCreateWithoutGenreInput,
    inputGenre: Prisma.GenreCreateWithoutSubgenreIdsInput,
  ): Prisma.SubgenreCreateNestedOneWithoutReviewsInput {
    return {
      connectOrCreate: {
        where: {
          title: inputSubgenre.title,
        },
        create: {
          title: inputSubgenre.title,
          link: inputSubgenre.link,
          genre: {
            connectOrCreate: {
              where: {
                title: inputGenre.title,
              },
              create: inputGenre,
            },
          },
        },
      },
    };
  }
}
