// backend/src/modules/contact/contact.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly prisma = new PrismaClient();

  async getList(openid: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { openid },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: contacts };
  }

  async create(openid: string, data: { nickname: string; identity: string; target: string; style: string }) {
    const contact = await this.prisma.contact.create({
      data: { openid, ...data },
    });
    return { success: true, data: contact };
  }

  async delete(openid: string, contactId: number) {
    await this.prisma.contact.deleteMany({
      where: { id: contactId, openid },
    });
    return { success: true };
  }
}
