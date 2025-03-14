import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NanarlandService } from './nanarland.service';

@Resolver()
export class NanarlandResolver {
  constructor(private readonly nanarlandService: NanarlandService) {}

  @Query(() => String)
  sayHello(): string {
    return 'Hello World!';
  }

  @Mutation(() => [String])
  async getChroniclesHrefs() {
    return this.nanarlandService.getChroniclesHrefs();
  }

  @Mutation(() => String)
  async getChronicleData(@Args('href') href: string) {
    return this.nanarlandService.getChronicleData(href);
  }
}
