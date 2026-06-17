import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly configService: ConfigService) {}

  async submit(data: { openid: string; content: string; contact?: string; image?: string }): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: 将反馈存入数据库或通过邮件通知管理员
      this.logger.log(收到新反馈: ...);
      
      // 内容安全检查
      // await this.msgSecCheck(data.content);

      return {
        success: true,
        message: '反馈已提交，感谢你的意见！',
      };
    } catch (error) {
      this.logger.error('反馈提交失败:', error);
      return {
        success: false,
        message: '提交失败，请稍后再试',
      };
    }
  }
}
