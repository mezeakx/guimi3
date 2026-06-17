import { Controller, Post, UseGuards, Req, UploadedFile, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OcrService } from './ocr.service';

@Controller('ocr')
@UseGuards(AuthGuard)
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly ocrService: OcrService) {}

  @Post('recognize')
  @UseGuards(FileInterceptor('image'))
  async recognize(@Req() req, @UploadedFile() file: Express.Multer.File) {
    this.logger.log('OCR 识别请求');
    return this.ocrService.recognize(file.buffer);
  }
}
