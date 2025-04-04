import { Module } from '@nestjs/common';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { NanarlandModule } from './nanarland/nanarland.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { TmdbModule } from './tmdb/tmdb.module';
import { UserModule } from './user/user.module';
import { CommonModule } from './common/common.module';
import { GenresModule } from './genres/genres.module';
import { ReviewModule } from './review/review.module';
import { RatingModule } from './rating/rating.module';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PuppeteerModule,
    NanarlandModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    TmdbModule,
    UserModule,
    CommonModule,
    GenresModule,
    ReviewModule,
    RatingModule,
    VideosModule,
  ],
})
export class AppModule {}
