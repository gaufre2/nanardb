import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
} from 'class-validator';
import { UserRawDto } from 'src/user/dto';

export class UserRatingRawDto {
  @IsObject()
  @IsNotEmptyObject()
  user: UserRawDto;

  @IsNumber()
  @IsNotEmpty()
  rating: number;
}
