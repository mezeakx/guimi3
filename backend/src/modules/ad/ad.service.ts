// backend/src/modules/ad/ad.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const REDIS_PREFIX = 'guimi:';

@Injectable()
export class AdService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(AdService.name);
  private readonly maxDailyRewards = 5; // 每日广告奖励上限
  private redis: any;

  async init() {
    // Redis 连接初始化（生产环境使用 ioredis）
    // this.redis = new Redis(process.env.REDIS_URL);
  }

  /** 授予广告奖励次数 */
  async grantReward(openid: string): Promise<{ remaining: number; message?: string }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `${REDIS_PREFIX}reward:${openid}:${today}`;

      // 查询用户今日已获得的广告奖励次数
      // 使用 rewardCount 字段跟踪今日奖励（由定时任务每日重置）
      const user = await this.prisma.user.findUnique({
        where: { openid },
        select: { freeCount: true, rewardCount: true },
      });

      if (!user) {
        return { remaining: 0, message: '用户不存在' };
      }

      // 通过 rewardCount 来判断今日已获得多少次广告奖励
      if (user.rewardCount >= this.maxDailyRewards) {
        return { remaining: 0, message: '今日广告次数已达上限' };
      }

      // 增加用户免费次数和广告奖励计数
      const updated = await this.prisma.user.update({
        where: { openid },
        data: { freeCount: { increment: 1 }, rewardCount: { increment: 1 } },
        select: { freeCount: true },
      });

      return { remaining: updated.freeCount };
    } catch (error) {
      this.logger.error('广告奖励失败:', error);
      return { remaining: 0, message: '奖励发放失败' };
    }
  }
}
