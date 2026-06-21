// backend/src/modules/analysis/analysis.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
@UseGuards(AuthGuard)
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