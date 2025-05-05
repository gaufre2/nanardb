import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

@InputType()
export class UserRawDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  username: string;

  @IsUrl()
  @Field()
  avatarLink: string | null;
}
