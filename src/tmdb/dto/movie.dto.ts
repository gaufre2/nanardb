export class MovieDetailsResponseDto {
  id: number;
  imdb_id: string;
  original_title: string;
  title: string;
  overview: string;
  release_date: string;
  runtime: number;
  origin_country: string[];
  keywords: {
    id: number;
    name: string;
  }[];
}
