// backend/src/modules/ad/ad.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { AdService } from './ad.service';

@Controller('ad')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post('reward')
  async grantReward(@Req() req: any, @Body() body: { ad_id?: string; ad_error?: string }) {
    if (body.ad_error) {
      // 广告播放失败，不给予奖励
      return { success: false, message: '广告播放失败' };
    }
    return this.adService.grantReward(req.user.openid);
  }
}
