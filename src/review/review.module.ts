import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { VideosService } from 'src/videos/videos.service';
import { RatingService } from 'src/rating/rating.service';
import { GenresService } from 'src/genres/genres.service';
import { UserService } from 'src/user/user.service';
import { NanarlandModule } from 'src/nanarland/nanarland.module';
import { ReviewResolver } from './review.resolver';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { PosterService } from 'src/poster/poster.service';
import { TmdbModule } from 'src/tmdb/tmdb.module';

@Module({
  imports: [NanarlandModule, TmdbModule],
  providers: [
    ReviewService,
    VideosService,
    RatingService,
    GenresService,
    UserService,
    ReviewResolver,
    TmdbService,
    PosterService,
  ],
})
export class ReviewModule {}
