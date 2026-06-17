// backend/src/modules/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();
  private readonly wxAppId = process.env.WX_APP_ID;
  private readonly wxAppSecret = process.env.WX_APP_SECRET;

  constructor(private readonly jwtService: JwtService) {}

  async login(code: string) {
    // 1. 用 code 换取 openid
    const wxResult = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: this.wxAppId,
        secret: this.wxAppSecret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, session_key } = wxResult.data;
    if (!openid) {
      throw new BadRequestException('微信登录失败');
    }

    // 2. 查找或创建用户
    let user = await this.prisma.user.findUnique({ where: { openid } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { openid },
      });
    }

    // 3. 生成 JWT
    const payload = { openid, userId: user.id };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          openid: user.openid,
          free_count: user.freeCount,
          disclaimer_accepted: user.disclaimerAccepted,
        },
      },
    };
  }
}
