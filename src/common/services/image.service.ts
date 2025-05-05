import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, lastValueFrom, retry } from 'rxjs';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
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
            const message = `Impossible to fetch image: ${url}`;
            this.logger.error(message + `, axios error code: ${error.code}`);
            throw new InternalServerErrorException(message);
          }),
        ),
    );
    return data;
  }
}
