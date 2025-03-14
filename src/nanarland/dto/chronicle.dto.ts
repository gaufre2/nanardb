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

export class ChronicleDto {
  @IsUrl()
  @IsNotEmpty()
  link: string;

  @IsInt()
  @IsOptional()
  createYear?: number;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsArray()
  raters: string[];

  @IsString()
  @IsNotEmpty()
  genre: string;

  @IsString()
  @IsNotEmpty()
  genreHref: string;

  @IsString()
  @IsNotEmpty()
  subGenre: string;

  @IsString()
  @IsNotEmpty()
  subGenreHref: string;

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

  @IsString()
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

  @IsString()
  @IsOptional()
  posterLink: string;

  @IsDecimal()
  @IsOptional()
  averageRating: number;

  @IsEnum(RarityRanting)
  @IsNotEmpty()
  rarityRating: RarityRanting;
}
