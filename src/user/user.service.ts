import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { ImageService, PrismaService } from 'src/common';
import { CreateUserInput } from './dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly image: ImageService,
  ) {}

  private async findUser(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where,
    });
    if (user) {
      this.logger.verbose(`User "${user.username}" found at Id: ${user.id}`);
    }
    return user;
  }

  private async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({ data });
    this.logger.debug(`User "${user.username}" created with Id: ${user.id}`);
    return user;
  }

  async findOrCreateUsers(userInputs: CreateUserInput[]): Promise<User[]> {
    const users = await Promise.all(
      userInputs.map(async (userInput) => {
        // Search for existing User
        const foundUser = await this.findUser({ username: userInput.username });
        if (foundUser) return foundUser;

        // Avatar fetching
        const avatarBuffer = await this.image.fetchImage(userInput.avatarLink);
        // Creation of the User if not found
        const userData: Prisma.UserCreateInput = {
          username: userInput.username,
          avatar: avatarBuffer,
        };
        return await this.createUser(userData);
      }),
    );
    return users;
  }
}
