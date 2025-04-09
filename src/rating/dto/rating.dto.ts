import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
} from 'class-validator';
import { CreateUserInput } from 'src/user/dto';

export class UserRatingRawDto {
  @IsObject()
  @IsNotEmptyObject()
  user: CreateUserInput;

  @IsNumber()
  @IsNotEmpty()
  rating: number;
}
