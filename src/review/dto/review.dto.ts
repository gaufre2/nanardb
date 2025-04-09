import { Rarity } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { GenreRawDto } from 'src/genres/dto';
import { UserRatingRawDto } from 'src/rating/dto';
import {
  CutVideoRawDto,
  EscaleANanarlandVideoRawDto,
  NanaroscopeVideoRawDto,
} from 'src/videos/dto';

export class ReviewRawDto {
  @IsUrl()
  @IsNotEmpty()
  link: string;

  @IsNumber()
  @IsOptional()
  createYear?: number;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsArray()
  @IsObject({ each: true })
  @IsNotEmpty()
  userRatings: UserRatingRawDto[];

  @IsNumber()
  @IsNotEmpty()
  rarityRating: Rarity;

  @IsObject()
  @IsNotEmpty()
  genre: GenreRawDto;

  @IsObject()
  @IsNotEmpty()
  subgenre: GenreRawDto;

  @IsString()
  @IsNotEmpty()
  mainTitle: string;

  @IsString()
  @IsOptional()
  originalTitle?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alternativeTitles?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  directors: string[];

  @IsNumber()
  @IsOptional()
  releaseYear?: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  originCountries: string[];

  @IsNumber()
  @IsNotEmpty()
  runtime: number;

  @IsArray()
  @IsObject({ each: true })
  cutVideos: CutVideoRawDto[];

  @IsArray()
  @IsObject({ each: true })
  escaleANanarlandVideos: EscaleANanarlandVideoRawDto[];

  @IsArray()
  @IsObject({ each: true })
  nanaroscopeVideos: NanaroscopeVideoRawDto[];

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  averageRating: number;

  @IsUrl()
  @IsNotEmpty()
  posterLink: string;
}
