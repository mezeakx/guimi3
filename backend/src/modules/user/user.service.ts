import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
export class UserService {
  private readonly logger = new Logger(UserService.name);
  
  constructor(private readonly configService: ConfigService) {}

  async getUserInfo(openid: string): Promise<UserInfo> {
    // TODO: 从数据库查询用户信息
    // 临时返回模拟数据
    return {
      openid,
      free_count: 3,
      used_today: 0,
      total_uses: 0,
      created_at: new Date(),
    };
  }

  async updateUser(openid: string, data: Partial<Pick<UserInfo, 'nickname' | 'avatar'>>): Promise<UserInfo> {
    this.logger.log(更新用户信息: );
    // TODO: 更新数据库
    return this.getUserInfo(openid);
  }

  async incrementUsage(openid: string): Promise<void> {
    this.logger.log(增加使用次数: );
    // TODO: 更新数据库中的 used_today 和 total_uses
  }

  async resetDailyUsage(openid: string): Promise<void> {
    this.logger.log(重置日使用次数: );
    // TODO: 重置 used_today
  }
}
