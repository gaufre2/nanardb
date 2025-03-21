import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { RarityRanting } from 'src/common/dto';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  avatarLink: string;
}

export class UserRatingDto {
  @IsNotEmpty()
  user: UserDto;

  @IsDecimal()
  @IsOptional()
  rating: number;
}

export class GenreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  link: string;
}

export class ChronicleDto {
  @IsUrl()
  @IsNotEmpty()
  link: string;

  @IsInt()
  @IsOptional()
  createYear?: number;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsArray()
  userRatings: UserRatingDto[];

  @IsDecimal()
  @IsOptional()
  averageRating: number;

  @IsEnum(RarityRanting)
  @IsNotEmpty()
  rarityRating: RarityRanting;

  @IsNotEmpty()
  genre: GenreDto;

  @IsNotEmpty()
  subGenre: GenreDto;

  @IsString()
  @IsNotEmpty()
  mainTitle: string;

  @IsString()
  @IsOptional()
  originalTitle?: string;

  @IsString()
  @IsArray()
  @IsOptional()
  alternativeTitles?: string[];

  @IsArray()
  directors: string[];

  @IsInt()
  @IsOptional()
  releaseYear?: number;

  @IsString()
  @IsArray()
  originCountries: string[];

  @IsInt()
  @IsOptional()
  runtime: number;

  @IsUrl()
  @IsOptional()
  posterLink: string;
}
