import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { HttpModule } from '@nestjs/axios';
import { TmdbResolver } from './tmdb.resolver';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [TmdbService, TmdbResolver],
  exports: [TmdbService, HttpModule],
})
export class TmdbModule {}
