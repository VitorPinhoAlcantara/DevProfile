import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { ContentAdminService } from './content-admin.service.js';
import { RevalidationService } from './revalidation.service.js';

@Module({
  controllers: [AdminController],
  providers: [ContentAdminService, RevalidationService],
})
export class AdminModule {}
