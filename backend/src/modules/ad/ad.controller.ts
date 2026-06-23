// backend/src/modules/ad/ad.controller.ts
import { Controller, Post, Body, Req, UseGuards, Logger, HttpCode } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdService } from './ad.service';

@Controller('ad')
@UseGuards(AuthGuard)
export class AdController {
  private readonly logger = new Logger(AdController.name);

  constructor(private readonly adService: AdService) {}

  @Post('watch')
  @HttpCode(200)
  async watchAd(@Req() req: any, @Body() body: { ad_id?: string; ad_error?: string }) {
    if (body.ad_error) {
      this.logger.warn('广告播放失败:', body.ad_error);
      return { message: '广告播放失败' };
    }

    this.logger.log(`广告观看完成, openid=${req.user.openid}`);
    return this.adService.grantReward(req.user.openid);
  }
}
