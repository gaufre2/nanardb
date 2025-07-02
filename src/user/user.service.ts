import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ImageService, PrismaService } from 'src/common';
import { UserRawDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,
  ) {}
  private readonly logger = new Logger(UserService.name);

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

  async upsertUserAndReturnId(userRawData: UserRawDto): Promise<string> {
    try {
      let avatar = null;
      if (userRawData.avatarLink) {
        avatar = await this.image.fetchImage(userRawData.avatarLink);
      }

      const userInput: Prisma.UserCreateInput = {
        username: userRawData.username,
        avatar,
      };

      const user = await this.prisma.user.upsert({
        where: { username: userRawData.username },
        create: userInput,
        update: userInput,
        select: { id: true },
      });
      return user.id;
    } catch (error) {
      this.logger.error('Error upserting user:', error);
      throw error;
    }
  }
}
