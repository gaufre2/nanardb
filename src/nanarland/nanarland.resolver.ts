import { Args, Query, Resolver } from '@nestjs/graphql';
import { NanarlandService } from './nanarland.service';

@Resolver()
export class NanarlandResolver {
  constructor(private readonly nanarlandService: NanarlandService) {}

  @Query(() => [String])
  async chroniclesHrefs() {
    return this.nanarlandService.getChroniclesHrefs();
  }

  @Query(() => String)
  async chronicleData(@Args('href') href: string) {
    return this.nanarlandService.getChronicleData(href);
  }
}
