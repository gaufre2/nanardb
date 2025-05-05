import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { join, parse } from 'path';
import { PosterRawDto } from './dto';
import { ImageService } from 'src/common';

@Injectable()
export class PosterService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly image: ImageService,
  ) {}
  private readonly logger = new Logger(PosterService.name, {
    timestamp: true,
  });

  private readonly storagePath = this.config.getOrThrow<string>('STORAGE_PATH');
  private readonly posterDir = this.config.getOrThrow<string>('POSTER_DIR');
  readonly storagePosterPath = join(this.storagePath, this.posterDir);

  private async initStorageDirectory() {
    try {
      await fs.mkdir(this.storagePosterPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create storage directory: ${error}`);
    }
  }

  async onModuleInit() {
    await this.initStorageDirectory();
  }

  private async savePoster(image: PosterRawDto): Promise<string> {
    const hash = createHash('sha256').update(image.buffer).digest('hex');
    const filename = `${hash}.${image.extension}`;
    const filepath = join(this.storagePosterPath, filename);

    try {
      await fs.writeFile(filepath, image.buffer);
    } catch (error) {
      this.logger.error(`Failed to save poster file: ${error}`);
      throw new InternalServerErrorException('Failed to save poster file');
    }
    this.logger.debug(`Saved poster at ${filepath}`);

    return filename;
  }

  async fetchAndSavePoster(link: string): Promise<string> {
    const buffer = await this.image.fetchImage(link);
    const extension = parse(new URL(link).pathname).ext.slice(1);

    return await this.savePoster({
      buffer,
      extension,
    });
  }

  async deletePoster(filename: string): Promise<void> {
    const filepath = join(this.storagePosterPath, filename);
    try {
      await fs.unlink(filepath);
      this.logger.debug(`Deleted poster at ${filepath}`);
    } catch (error) {
      this.logger.error(`Failed to delete poster file: ${error}`);
      throw new InternalServerErrorException('Failed to delete poster file');
    }
  }
}
