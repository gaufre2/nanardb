import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

@InputType()
export class CreateSubgenreInput {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  @Field()
  link: string;

  @IsInt()
  @IsNotEmpty()
  @Field(() => Int)
  genreConnectId: number;
}

@InputType()
export class SubgenreWhereInput {
  @IsInt()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  id?: number;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  title?: string;
}
