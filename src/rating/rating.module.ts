import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [RatingService, UserService],
})
export class RatingModule {}
