// backend/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { code: string }) {
    return this.authService.login(body.code);
  }
}
