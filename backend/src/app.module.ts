// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { UserModule } from './modules/user/user.module';
import { AdModule } from './modules/ad/ad.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ContactModule,
    AnalysisModule,
    UserModule,
    AdModule,
  ],
})
export class AppModule {}
