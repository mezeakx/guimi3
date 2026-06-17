import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { UserService, UserInfo } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('info')
  async getInfo(@CurrentUser() user: any): Promise<UserInfo> {
    return this.userService.getUserInfo(user.openid);
  }

  @Post('update-profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() data: { nickname?: string; avatar?: string },
  ): Promise<UserInfo> {
    return this.userService.updateUser(user.openid, data);
  }
}
