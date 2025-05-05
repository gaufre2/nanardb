import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, lastValueFrom, retry } from 'rxjs';

@Injectable()
export class ImageService {
  constructor(private readonly httpService: HttpService) {}

  async fetchImage(url: string): Promise<Buffer> {
    const { data } = await lastValueFrom(
      this.httpService
        .get<Buffer>(url, {
          responseType: 'arraybuffer',
          timeout: 10000,
          maxRedirects: 5,
        })
        .pipe(
          retry(3),
          catchError((error: AxiosError) => {
            throw new Error(
              `Impossible to fetch image: ${url}, error: ${error.code}`,
            );
          }),
        ),
    );
    return data;
  }
}
