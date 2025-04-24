import { IsNotEmpty, IsString } from 'class-validator';

export class PosterRawDto {
  @IsNotEmpty()
  buffer: Buffer;

  @IsString()
  @IsNotEmpty()
  extension: string;
}
