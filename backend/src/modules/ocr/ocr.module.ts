import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  ],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}
