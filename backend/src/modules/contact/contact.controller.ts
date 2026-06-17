// backend/src/modules/contact/contact.controller.ts
import { Controller, Post, Body, Get, Delete, Req } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('list')
  async getList(@Req() req: any) {
    return this.contactService.getList(req.user.openid);
  }

  @Post('create')
  async create(@Req() req: any, @Body() body: { nickname: string; identity: string; target: string; style: string }) {
    return this.contactService.create(req.user.openid, body);
  }

  @Post('delete')
  async delete(@Req() req: any, @Body() body: { contact_id: number }) {
    return this.contactService.delete(req.user.openid, body.contact_id);
  }
}
