import {
  Args,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { CreateUserInput, UserWhereInput } from './dto';
import { ImageService } from 'src/common/services/image.service';

@ObjectType()
class User {
  @Field()
  id: string;

  @Field()
  username: string;
}

@Resolver()
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly imageService: ImageService,
  ) {}

  @Query(() => User, { nullable: true })
  async user(@Args('where') where: UserWhereInput) {
    return await this.userService.user({
      id: where.id,
      username: where.username,
    });
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput) {
    const avatar = await this.imageService.fetchImage(input.avatarLink);
    const data = {
      username: input.username,
      avatar,
    };

    return await this.userService.createUser(data);
  }

  @Mutation(() => User, { nullable: true })
  async deleteUser(@Args('where') where: UserWhereInput) {
    return await this.userService.deleteUser({
      id: where.id,
      username: where.username,
    });
  }
}
