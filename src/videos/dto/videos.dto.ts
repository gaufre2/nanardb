import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  IsUrl,
} from 'class-validator';

export class CutVideoRawDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  averageRating: number;

  @IsArray()
  @IsObject({ each: true })
  links: {
    src: string;
    type: string;
  }[];
}

export class EscaleANanarlandVideoRawDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  pageLink: string;

  @IsDate()
  @IsNotEmpty()
  publicationDate: Date;
}

export class NanaroscopeVideoRawDto {
  @IsString()
  @IsNotEmpty()
  seasonEpisodeCode: string;

  @IsString()
  @IsNotEmpty()
  tagline: string;
}
