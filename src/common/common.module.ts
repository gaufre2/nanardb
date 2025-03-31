import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ImageService } from './services/image.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ImageService],
  exports: [ImageService],
})
export class CommonModule {}
