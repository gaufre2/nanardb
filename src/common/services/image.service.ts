import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { catchError, lastValueFrom } from 'rxjs';

@Injectable()
export class ImageService {
  constructor(private readonly httpService: HttpService) {}

  async fetchImage(url: string): Promise<Buffer> {
    const response = await lastValueFrom(
      this.httpService.get<Buffer>(url, { responseType: 'arraybuffer' }).pipe(
        catchError(() => {
          throw new InternalServerErrorException(
            `Impossible to fetch image: ${url}`,
          );
        }),
      ),
    );
    return response.data;
  }
}
