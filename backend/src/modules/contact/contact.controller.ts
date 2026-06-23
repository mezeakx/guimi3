// backend/src/modules/contact/contact.controller.ts
import { Controller, Post, Get, Body, Param, Delete, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ContactService } from './contact.service';

@Controller('contact')
@UseGuards(AuthGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('list')
  async getList(@Req() req: any) {
    return this.contactService.getList(req.user.openid);
  }

  @Post('create')
  @HttpCode(200)
  async create(@Req() req: any, @Body() body: {
    nickname: string;
    identities?: string[];
    identity_labels?: string[];
    target?: string[];
    target_labels?: string[];
    style?: string[];
    style_labels?: string[];
    avatar?: string;
  }) {
    return this.contactService.create(req.user.openid, body);
  }

  @Post('update/:id')
  @HttpCode(200)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: {
      nickname?: string;
      identities?: string[];
      identity_labels?: string[];
      target?: string[];
      target_labels?: string[];
      style?: string[];
      style_labels?: string[];
      avatar?: string;
    },
  ) {
    return this.contactService.update(Number(id), req.user.openid, body);
  }

  @Get('detail/:id')
  async detail(@Req() req: any, @Param('id') id: string) {
    return this.contactService.getDetail(Number(id), req.user.openid);
  }

  @Post('delete/:id')
  @HttpCode(200)
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.contactService.delete(Number(id), req.user.openid);
  }
}
