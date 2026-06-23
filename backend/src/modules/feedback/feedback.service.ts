// backend/src/modules/feedback/feedback.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentSafetyService } from '../content-safety/content-safety.service';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private readonly contentSafety = new ContentSafetyService();

  constructor(private readonly configService: ConfigService) {}

  async submit(data: {
    openid: string;
    content: string;
    contact?: string;
    image?: string;
  }): Promise<{ message: string }> {
    try {
      // 内容安全检查
      const check = await this.contentSafety.msgSecCheck(data.content);
      if (!check.passed) {
        this.logger.warn('反馈内容审核不通过:', check.reason);
        return {
          message: '反馈内容包含不合规信息，请修改后重试',
        };
      }

      // TODO: 将反馈存入数据库或通过邮件通知管理员
      this.logger.log(`收到新反馈: openid=${data.openid}, contact=${data.contact || '无'}`);

      return {
        message: '反馈已提交，感谢你的意见！',
      };
    } catch (error) {
      this.logger.error('反馈提交失败:', error);
      return {
        message: '提交失败，请稍后再试',
      };
    }
  }
}
