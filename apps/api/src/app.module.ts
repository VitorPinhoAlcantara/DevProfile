import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CONTACT_LIMIT, LOGIN_LIMIT } from './common/throttling.js';
import { CvModule } from './cv/cv.module.js';
import { ContactModule } from './contact/contact.module.js';
import { HealthModule } from './health/health.module.js';
import { MediaModule } from './media/media.module.js';
import { OpenApiModule } from './openapi/openapi.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicContentModule } from './public/public-content.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([CONTACT_LIMIT, LOGIN_LIMIT]),
    PrismaModule,
    AuthModule,
    AdminModule,
    HealthModule,
    PublicContentModule,
    ContactModule,
    MediaModule,
    CvModule,
    OpenApiModule,
  ],
})
export class AppModule {}
