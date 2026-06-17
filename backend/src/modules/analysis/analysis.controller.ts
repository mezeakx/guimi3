// backend/src/modules/analysis/analysis.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('generate')
  async generate(@Req() req: any, @Body() body: {
    message: string;
    context?: string;
    contact_id?: number;
    identity?: string;
    target?: string;
    style?: string;
  }) {
    return this.analysisService.analyze(req.user.openid, body);
  }
}
