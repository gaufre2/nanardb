import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Review } from '@prisma/client';
import { PrismaService } from 'src/common';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async review(where: Prisma.ReviewWhereUniqueInput): Promise<Review | null> {
    return await this.prisma.review.findUnique({ where });
  }
  async reviews(where: Prisma.ReviewWhereInput): Promise<Review[] | null> {
    return await this.prisma.review.findMany({ where });
  }

  async createReview(data: Prisma.ReviewCreateInput): Promise<Review> {
    try {
      return await this.prisma.review.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Review already exists`);
        }
        // TODO add error code for invalid foreigner table id
      }
      throw new InternalServerErrorException(error);
    }
  }

  async updateReview(
    data: Prisma.ReviewCreateInput,
    where: Prisma.ReviewWhereUniqueInput,
  ): Promise<Review> {
    try {
      return await this.prisma.review.update({ data, where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Review not found`); // TODO if invalid foreigner table ?
        }
      }
      throw new InternalServerErrorException(error);
    }
  }

  async deleteReview(
    where: Prisma.ReviewWhereUniqueInput,
  ): Promise<Review | null> {
    try {
      return await this.prisma.review.delete({ where });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Review not found`); // TODO if invalid foreigner table ?
        }
      }
      throw new InternalServerErrorException(error);
    }
  }
}
