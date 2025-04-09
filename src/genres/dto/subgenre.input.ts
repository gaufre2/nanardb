import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { CreateGenreInput } from './genre.input';

@InputType()
export class CreateGenreAndSubgenreInput {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  @Field()
  link: string;

  @IsObject()
  @IsNotEmpty()
  parentGenre: CreateGenreInput;
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
