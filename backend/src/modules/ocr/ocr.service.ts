import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async recognize(imageBuffer: Buffer): Promise<{ text: string }> {
    try {
      // TODO: 接入腾讯 OCR 或微信 OCR SDK
      // 临时返回模拟数据
      this.logger.log('OCR 识别完成（模拟）');
      return {
        text: '这是一段模拟的 OCR 识别结果。实际使用时需要接入腾讯云 OCR 或微信 OCR SDK。',
      };
    } catch (error) {
      this.logger.error('OCR 识别失败:', error);
      return {
        text: '',
      };
    }
  }
}
