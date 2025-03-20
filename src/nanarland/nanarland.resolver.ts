import { Args, Query, Resolver } from '@nestjs/graphql';
import { NanarlandService } from './nanarland.service';

@Resolver()
export class NanarlandResolver {
  constructor(private readonly nanarlandService: NanarlandService) {}

  @Query(() => [String])
  async chroniclesHrefs(@Args('ignoreCache') ignoreCache: boolean) {
    return this.nanarlandService.getChroniclesHrefs(ignoreCache);
  } // TODO remove, only for test

  @Query(() => String)
  async chronicleData(
    @Args('href') href: string,
    @Args('ignoreCache') ignoreCache: boolean,
  ) {
    return JSON.stringify(
      await this.nanarlandService.getChronicleData(href, ignoreCache),
    );
  } // TODO remove, only for test
}
