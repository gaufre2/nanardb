import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { Nanar } from './models/nanar.model';
import { NanarService } from './nanar.service';

@Resolver(() => Nanar)
export class NanarResolver {
  constructor(private readonly nanarService: NanarService) {}

  @Query(() => String)
  sayHello(): string {
    return 'Hello World!';
  }

  @Mutation(() => [String])
  async getChroniclesHrefs() {
    return this.nanarService.getChroniclesHrefs();
  }
}
