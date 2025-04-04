import { RarityRanting } from 'src/common/dto';
import { CreateGenreInput } from 'src/genres/dto';

export class UserDto {
  name: string;
  avatarLink: string;
}

export class UserRatingDto {
  user: UserDto;
  rating: number;
}

export class GenreDto {
  title: string;
  link: string;
}

export class CutVideoDto {
  id: number;
  title: string;
  averageRating: number;
  links: {
    src: string;
    type: string;
  }[];
}

export class EscaleANanarlandVideoDto {
  id: number;
  title: string;
  pageLink: string;
  publicationDate: Date;
}

export class NanaroscopeVideoDto {
  seasonEpisodeCode: string;
  tagline: string;
}

export class ChronicleDto {
  link: string;
  createYear?: number;
  authorName: string;
  userRatings: UserRatingDto[];
  averageRating: number;
  rarityRating: RarityRanting;
  genre: CreateGenreInput;
  subgenre: CreateGenreInput;
  mainTitle: string;
  originalTitle?: string;
  alternativeTitles?: string[];
  directors: string[];
  releaseYear?: number;
  originCountries: string[];
  runtime: number;
  cutVideos: CutVideoDto[];
  escaleANanarlandVideos: EscaleANanarlandVideoDto[];
  nanaroscopeVideos: NanaroscopeVideoDto[];
  posterLink: string;
}
