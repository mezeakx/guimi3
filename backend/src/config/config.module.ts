// backend/src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Module({
  exports: ['ConfigService'],
  providers: [
    {
      provide: 'CONFIG_OPTIONS',
      useFactory: () => ({
        databaseUrl: process.env.DATABASE_URL,
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        jwtSecret: process.env.JWT_SECRET || 'guimi-secret-key-change-in-production',
        jwtExpiresIn: '7d',
        aiApiKey: process.env.AI_API_KEY,
        aiBaseUrl: process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
        wxAppId: process.env.WX_APP_ID,
        wxAppSecret: process.env.WX_APP_SECRET,
        ocrApiKey: process.env.OCR_API_KEY,
      }),
    },
  ],
})
export class ConfigModule {}
