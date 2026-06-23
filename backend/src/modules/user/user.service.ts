// backend/src/modules/user/user.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface UserInfo {
  openid: string;
  nickname?: string;
  avatar?: string;
  free_count: number;
  used_today: number;
  total_uses: number;
  created_at: Date;
}

@Injectable()
export class UserService extends PrismaClient {
  private readonly logger = new Logger(UserService.name);

  async getUserInfo(openid: string): Promise<UserInfo> {
    const user = await this.user.findUnique({
      where: { openid },
    });

    if (!user) {
      return {
        openid,
        free_count: 3,
        used_today: 0,
        total_uses: 0,
        created_at: new Date(),
      };
    }

    return {
      openid: user.openid,
      free_count: user.freeCount,
      used_today: user.usedToday || 0,
      total_uses: user.totalUses || 0,
      created_at: user.createdAt,
    };
  }

  async updateUser(
    openid: string,
    data: Partial<Pick<UserInfo, 'nickname' | 'avatar'>>,
  ): Promise<UserInfo> {
    await this.user.update({
      where: { openid },
      data,
    });
    return this.getUserInfo(openid);
  }

  /** 扣减一次使用次数，返回剩余次数 */
  async decrementUsage(openid: string): Promise<{ success: boolean; remaining: number }> {
    const user = await this.user.findUnique({
      where: { openid },
    });
    if (!user) {
      return { success: false, remaining: 0 };
    }

    if (user.freeCount <= 0) {
      return { success: false, remaining: 0 };
    }

    const updated = await this.user.update({
      where: { openid },
      data: { freeCount: { decrement: 1 } },
      select: { freeCount: true },
    });

    return { success: true, remaining: updated.freeCount };
  }

  /** 增加一次免费次数（广告奖励等） */
  async incrementFreeCount(openid: string): Promise<{ success: boolean; remaining: number }> {
    const updated = await this.user.update({
      where: { openid },
      data: { freeCount: { increment: 1 } },
      select: { freeCount: true },
    });
    return { success: true, remaining: updated.freeCount };
  }

  /** 增加总使用次数 */
  async recordUsage(openid: string): Promise<void> {
    await this.user.update({
      where: { openid },
      data: { usedToday: { increment: 1 }, totalUses: { increment: 1 } },
    });
  }

  /** 重置每日使用次数（定时任务调用） */
  async resetDailyUsage(openid: string): Promise<void> {
    await this.user.update({
      where: { openid },
      data: { usedToday: 0, rewardCount: 0 },
    });
  }
}
