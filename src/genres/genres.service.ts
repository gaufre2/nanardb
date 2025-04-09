import { Injectable, Logger } from '@nestjs/common';
import { Genre, Prisma, Subgenre } from '@prisma/client';
import { PrismaService } from 'src/common';
import { CreateGenreAndSubgenreInput, CreateGenreInput } from './dto';

@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async findGenre(
    where: Prisma.GenreWhereUniqueInput,
  ): Promise<Genre | null> {
    const genre = await this.prisma.genre.findUnique({ where });
    if (genre) {
      this.logger.verbose(`Genre "${genre.title}" found at Id: ${genre.id}`);
    }
    return genre;
  }

  private async createGenre(data: Prisma.GenreCreateInput): Promise<Genre> {
    const genre = await this.prisma.genre.create({ data });
    this.logger.debug(`Genre "${genre.title}" created with Id: ${genre.id}`);
    return genre;
  }

  private async findSubgenre(
    where: Prisma.SubgenreWhereUniqueInput,
  ): Promise<Subgenre | null> {
    const subgenre = await this.prisma.subgenre.findUnique({ where });
    if (subgenre) {
      this.logger.verbose(
        `Subgenre "${subgenre.title}" found at Id: ${subgenre.id}`,
      );
    }
    return subgenre;
  }

  private async createSubgenre(
    data: Prisma.SubgenreCreateInput,
  ): Promise<Subgenre> {
    const subgenre = await this.prisma.subgenre.create({ data });
    this.logger.debug(
      `Subgenre "${subgenre.title}" created with Id: ${subgenre.id}`,
    );
    return subgenre;
  }

  private async findOrCreateGenre(
    genreInput: CreateGenreInput,
  ): Promise<Genre> {
    // Search for existing Genre
    const foundGenre = await this.findGenre({ title: genreInput.title });
    if (foundGenre) return foundGenre;

    // Creation of the Genre if not found
    const genreData: Prisma.GenreCreateInput = {
      title: genreInput.title,
      link: genreInput.link,
    };
    return await this.createGenre(genreData);
  }

  async findOrCreateGenreAndSubgenre(
    subgenreInput: CreateGenreAndSubgenreInput,
  ): Promise<Subgenre> {
    // Search for existing Subgenre
    const foundSubgenre = await this.findSubgenre({
      title: subgenreInput.title,
    });
    if (foundSubgenre) return foundSubgenre;

    // Search or create parent Genre
    const parentGenre = await this.findOrCreateGenre(subgenreInput.parentGenre);

    // Creation of the Subgenre if not found
    const subgenreData: Prisma.SubgenreCreateInput = {
      title: subgenreInput.title,
      link: subgenreInput.link,
      genre: { connect: { id: parentGenre.id } },
    };
    return await this.createSubgenre(subgenreData);
  }
}
