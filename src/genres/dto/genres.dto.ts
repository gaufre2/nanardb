import { IsNotEmpty, IsString } from 'class-validator';

export class GenreRawDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  link: string;
}
