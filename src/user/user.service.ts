import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  prepareUserConnectOrCreateInput(
    input: Prisma.UserCreateWithoutRatingsInput,
  ): Prisma.UserCreateNestedOneWithoutWrittenReviewsInput {
    return {
      connectOrCreate: {
        where: {
          username: input.username,
        },
        create: input,
      },
    };
  }

  prepareUsersConnectOrCreateInput(
    inputs: Prisma.UserCreateWithoutRatingsInput[],
  ): Prisma.UserCreateNestedOneWithoutWrittenReviewsInput[] {
    return inputs.map((input) => {
      return this.prepareUserConnectOrCreateInput(input);
    });
  }
}
