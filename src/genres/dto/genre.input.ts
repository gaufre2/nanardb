import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

@InputType()
export class CreateGenreInput {
  @IsString()
  @IsNotEmpty()
  @Field()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  @Field()
  link: string;
}

@InputType()
export class GenreWhereInput {
  @IsNumber()
  @IsOptional()
  @Field(() => Int, { nullable: true })
  id?: number;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  title?: string;
}
