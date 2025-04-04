import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImageService } from './services/image.service';
import { PrismaService } from './services/prisma.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ImageService, PrismaService, RedisService],
  exports: [ImageService, PrismaService, RedisService],
})
export class CommonModule {}
