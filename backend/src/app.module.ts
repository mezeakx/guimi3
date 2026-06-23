// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { UserModule } from './modules/user/user.module';
import { AdModule } from './modules/ad/ad.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { FeedbackModule } from './modules/feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'guimi-secret-key-change-in-production',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
      global: true,
    }),
    AuthModule,
    ContactModule,
    AnalysisModule,
    UserModule,
    AdModule,
    OcrModule,
    FeedbackModule,
  ],
})
export class AppModule {}