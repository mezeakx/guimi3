// backend/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Get, HttpCode, Req, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { code: string }) {
    try {
      return await this.authService.login(body.code);
    } catch (error) {
      this.logger.error('登录失败:', error);
      return {
        message: error.message || '服务器内部错误',
      };
    }
  }

  /** Token 验证接口 — 前端 app.js 调用 /auth/validate */
  @Get('validate')
  @UseGuards(AuthGuard)
  async validate(@Req() req: any) {
    return {
      authenticated: true,
      user: req.user,
    };
  }
}
