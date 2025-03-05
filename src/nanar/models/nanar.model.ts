import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'nanar' })
export class Nanar {
  @Field(() => [String])
  hrefs: string[];
}
