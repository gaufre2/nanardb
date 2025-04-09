import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Rating } from '@prisma/client';
import { PrismaService } from 'src/common';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async rating(where: Prisma.RatingWhereUniqueInput): Promise<Rating | null> {
    return await this.prisma.rating.findUnique({ where });
  }

  async createRating(data: Prisma.RatingCreateInput): Promise<Rating> {
    try {
      return await this.prisma.rating.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Rating already exists`);
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async deleteRating(
    where: Prisma.RatingWhereUniqueInput,
  ): Promise<Rating | null> {
    try {
      return await this.prisma.rating.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Rating not found');
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
}
