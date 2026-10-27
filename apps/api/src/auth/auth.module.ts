import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';
import { AuthController } from './auth.controller.js';
import { SessionsService } from './sessions.service.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [SessionsService, AdminGuard],
  exports: [SessionsService, AdminGuard],
})
export class AuthModule {}
