// backend/src/modules/content-safety/content-safety.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ContentSafetyService {
  private readonly logger = new Logger(ContentSafetyService.name);
  private readonly wxAppId = process.env.WX_APP_ID;
  private readonly wxAppSecret = process.env.WX_APP_SECRET;
  // 开发模式：当 APP_ID 为占位符时跳过内容安全审核
  private readonly devMode =
    !process.env.WX_APP_ID || process.env.WX_APP_ID === 'your-wechat-appid';
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  /** 获取微信 access_token（缓存 2 小时） */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        'https://api.weixin.qq.com/cgi-bin/token',
        {
          params: {
            appid: this.wxAppId,
            secret: this.wxAppSecret,
            grant_type: 'client_credential',
          },
        },
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
        return this.accessToken;
      }

      this.logger.error('获取 access_token 失败:', response.data);
      return '';
    } catch (error) {
      this.logger.error('获取 access_token 异常:', error.message);
      return '';
    }
  }

  /** 文本内容安全审核 */
  async msgSecCheck(content: string): Promise<{
    passed: boolean;
    reason: string;
  }> {
    if (!content || !content.trim()) {
      return { passed: true, reason: '空内容，跳过审核' };
    }

    // 开发模式：直接放行
    if (this.devMode) {
      return { passed: true, reason: '开发模式，跳过审核' };
    }

    const token = await this.getAccessToken();
    if (!token) {
      this.logger.warn('无法获取 access_token，跳过内容安全审核');
      return { passed: true, reason: '审核服务不可用，放行' };
    }

    try {
      const response = await axios.post(
        'https://api.weixin.qq.com/wxa/msg_sec_check',
        {
          content: content.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.errcode === 0) {
        return { passed: true, reason: '审核通过' };
      }

      return {
        passed: false,
        reason: response.data?.errmsg || '内容存在违规',
      };
    } catch (error) {
      this.logger.error('内容安全审核异常:', error.message);
      // 审核服务不可用时放行，避免阻塞用户
      return { passed: true, reason: '审核服务不可用，放行' };
    }
  }
}
