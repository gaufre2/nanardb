import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { HttpModule } from '@nestjs/axios';
import { TmdbResolver } from './tmdb.resolver';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [TmdbService, TmdbResolver, RedisService],
})
export class TmdbModule {}
