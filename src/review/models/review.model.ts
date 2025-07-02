import {
  Field,
  Float,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum ReviewManipulationEnum {
  Inserted,
  Updated,
}
registerEnumType(ReviewManipulationEnum, { name: 'ReviewManipulationEnum' });

@ObjectType()
export class reviewResponse {
  @Field()
  mainTitle: string;

  @Field(() => Int, { nullable: true })
  releaseYear?: number;

  @Field(() => Float, { nullable: true })
  averageRating?: number;

  @Field(() => Int)
  id: number;

  @Field()
  link: string;

  @Field(() => ReviewManipulationEnum)
  manipulation: ReviewManipulationEnum;
}
