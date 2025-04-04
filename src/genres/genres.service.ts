import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Genre, Prisma, Subgenre } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async genre(where: Prisma.GenreWhereUniqueInput): Promise<Genre | null> {
    return await this.prisma.genre.findUnique({ where });
  }

  async createGenre(data: Prisma.GenreCreateInput): Promise<Genre> {
    try {
      return await this.prisma.genre.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Genre already exists`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async deleteGenre(where: Prisma.GenreWhereUniqueInput): Promise<Genre> {
    try {
      return await this.prisma.genre.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Genre not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async subgenre(
    where: Prisma.SubgenreWhereUniqueInput,
  ): Promise<Subgenre | null> {
    return await this.prisma.subgenre.findUnique({ where });
  }

  async createSubgenre(data: Prisma.SubgenreCreateInput): Promise<Subgenre> {
    try {
      return await this.prisma.subgenre.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Subgenre already exists');
        } else if (error.code === 'P2025') {
          throw new NotFoundException(`Genre ID not found`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async deleteSubgenre(
    where: Prisma.SubgenreWhereUniqueInput,
  ): Promise<Subgenre | null> {
    try {
      return await this.prisma.subgenre.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Subgenre not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
}
