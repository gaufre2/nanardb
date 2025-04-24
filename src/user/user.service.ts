import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  prepareUserConnectOrCreateInput(
    input: Prisma.UserCreateWithoutRatingsInput,
  ): Prisma.UserCreateOrConnectWithoutRatingsInput {
    return {
      where: {
        username: input.username,
      },
      create: input,
    };
  }

  prepareUsersConnectOrCreateInput(
    inputs: Prisma.UserCreateWithoutRatingsInput[],
  ): Prisma.UserCreateOrConnectWithoutRatingsInput[] {
    return inputs.map((input) => {
      return this.prepareUserConnectOrCreateInput(input);
    });
  }
}
