import { Module } from '@nestjs/common';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { RedirectController } from './redirect.controller.js';

@Module({
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
