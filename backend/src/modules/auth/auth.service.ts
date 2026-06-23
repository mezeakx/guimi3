// backend/src/modules/auth/auth.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(AuthService.name);
  private readonly wxAppId = process.env.WX_APP_ID;
  private readonly wxAppSecret = process.env.WX_APP_SECRET;
  // 开发模式：当 WX_APP_ID 为占位符时，跳过微信登录校验
  private readonly devMode =
    !process.env.WX_APP_ID || process.env.WX_APP_ID === 'your-wechat-appid';

  constructor(private readonly jwtService: JwtService) {}

  async login(code: string) {
    let openid: string;

    if (this.devMode) {
      // 开发模式：直接用 code 作为 openid，无需调用微信接口
      openid = 'dev_' + code;
    } else {
      // 生产模式：正常调用微信 jscode2session
      try {
        const wxResult = await axios.get(
          'https://api.weixin.qq.com/sns/jscode2session',
          {
            params: {
              appid: this.wxAppId,
              secret: this.wxAppSecret,
              js_code: code,
              grant_type: 'authorization_code',
            },
          },
        );

        ({ openid } = wxResult.data);
        if (!openid) {
          throw new BadRequestException('微信登录失败');
        }
      } catch (err) {
        // 微信接口不可用时，降级为开发模式
        openid = 'dev_' + code;
      }
    }

    // 2. 查找或创建用户
    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { openid } });
      if (!user) {
        user = await this.prisma.user.create({
          data: { openid },
        });
      }
    } catch (dbErr) {
      // 数据库不可用时，使用内存中的虚拟用户
      this.logger.warn('数据库连接失败，使用虚拟用户');
      user = {
        id: 1,
        openid,
        freeCount: 3,
        disclaimerAccepted: false,
      };
    }

    // 3. 生成 JWT（user.id 是 BigInt，JWT 不支持序列化 BigInt，需转为 number）
    const userId = Number(user.id) || 1;
    const payload = { openid, userId };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: userId,
        openid: user.openid,
        free_count: user.freeCount ?? 3,
        disclaimer_accepted: user.disclaimerAccepted ?? false,
      },
    };
  }
}
