import { Module } from '@nestjs/common';
import { CvController } from './cv.controller.js';
import { CvService } from './cv.service.js';
import { LinksModule } from '../links/links.module.js';

@Module({
  imports: [LinksModule],
  controllers: [CvController],
  providers: [CvService],
})
export class CvModule {}
