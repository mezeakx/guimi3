import { Controller, Post, Body, UseGuards, Logger, HttpCode } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { FeedbackService } from './feedback.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('feedback')
@UseGuards(AuthGuard)
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('submit')
  @HttpCode(200)
  async submit(@Body() data: { content: string; contact?: string; image?: string; }, @CurrentUser() user: any) {
    this.logger.log(`反馈提交: openid=${user.openid}`);
    return this.feedbackService.submit({ ...data, openid: user.openid });
  }
}
