import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

@InputType()
export class CreateUserInput {
  @IsString()
  @IsNotEmpty()
  @Field()
  username: string;

  @IsUrl()
  @IsNotEmpty()
  @Field()
  avatarLink: string;
}

@InputType()
export class UserWhereInput {
  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  id?: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  username?: string;
}
