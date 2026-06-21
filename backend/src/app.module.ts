// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { UserModule } from './modules/user/user.module';
import { AdModule } from './modules/ad/ad.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'guimi-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    ContactModule,
    AnalysisModule,
    UserModule,
    AdModule,
  ],
})
export class AppModule {}