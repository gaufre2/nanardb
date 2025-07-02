import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, lastValueFrom, retry } from 'rxjs';

@Injectable()
export class ImageService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(ImageService.name);

  async fetchImage(url: string): Promise<Buffer> {
    const { data } = await lastValueFrom(
      this.httpService
        .get<Buffer>(url, {
          responseType: 'arraybuffer',
          timeout: 10000,
          maxRedirects: 5,
        })
        .pipe(
          retry({ count: 3, delay: 500 }),
          catchError((error: AxiosError) => {
            const message = `Impossible to fetch image: ${url}, error: ${error.code}`;
            this.logger.error(message);
            throw new Error(message);
          }),
        ),
    );
    return data;
  }
}
