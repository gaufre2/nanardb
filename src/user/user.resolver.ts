import {
  Args,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { UserService } from './user.service';

@ObjectType()
class User {
  @Field()
  id: string;

  @Field()
  username: string;
}

@InputType()
class UserInput {
  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  username?: string;
}

@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User, { nullable: true })
  async user(@Args('where') where: UserInput) {
    return await this.userService.user({
      id: where.id,
      username: where.username,
    });
  }

  @Mutation(() => User)
  async createUser(
    @Args('username') username: string,
    @Args('avatarLink') avatarLink: string,
  ) {
    return await this.userService.createUser(username, avatarLink);
  }

  @Mutation(() => User)
  async deleteUser(@Args('where') where: UserInput) {
    return await this.userService.deleteUser({
      id: where.id,
      username: where.username,
    });
  }
}
