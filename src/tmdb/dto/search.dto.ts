export class SearchMovieResponseDto {
  page: number;
  results: {
    id: number;
    title: string;
    original_title: string;
    release_date: string;
  }[];
  total_pages: number;
  total_results: number;
}
