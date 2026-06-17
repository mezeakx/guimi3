// backend/src/modules/ad/ad.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const REDIS_PREFIX = 'guimi:';

@Injectable()
export class AdService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(AdService.name);
  private redis: any;

  async init() {
    // Redis 连接初始化（生产环境使用 ioredis）
  }

  async grantReward(openid: string): Promise<{ success: boolean; remaining: number }> {
    try {
      // 检查今日广告奖励次数（Redis）
      const rewardKey = ${REDIS_PREFIX}reward:;
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = ${rewardKey}:;

      // 使用 Redis INCR 原子操作
      // const count = await this.redis.incr(dailyKey);
      // await this.redis.expire(dailyKey, 86400);
      // if (count > 5) {
      //   return { success: false, remaining: 0, message: '今日广告次数已达上限' };
      // }

      // 更新用户免费次数
      const user = await this.prisma.user.update({
        where: { openid },
        data: { freeCount: { increment: 1 } },
      });

      return { success: true, remaining: user.freeCount };
    } catch (error) {
      this.logger.error('广告奖励失败:', error);
      return { success: false, remaining: 0 };
    }
  }
}
