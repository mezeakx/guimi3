// backend/src/modules/contact/contact.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly prisma = new PrismaClient();

  async getList(openid: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { openid },
      orderBy: { createdAt: 'desc' },
    });
    // Prisma BigInt 需要转为 number 才能 JSON 序列化
    return contacts.map((c) => ({ ...c, id: Number(c.id) }));
  }

  async create(openid: string, data: {
    nickname: string;
    identities?: string[];
    identity_labels?: string[];
    target?: string[];
    target_labels?: string[];
    style?: string[];
    style_labels?: string[];
    avatar?: string;
  }) {
    if (!data.nickname || !data.nickname.trim()) {
      throw new BadRequestException('联系人昵称不能为空');
    }

    const contact = await this.prisma.contact.create({
      data: {
        openid,
        nickname: data.nickname.trim(),
        identities: data.identities ? JSON.stringify(data.identities) : null,
        identity_labels: data.identity_labels ? JSON.stringify(data.identity_labels) : null,
        target: data.target ? JSON.stringify(data.target) : null,
        target_labels: data.target_labels ? JSON.stringify(data.target_labels) : null,
        style: data.style ? JSON.stringify(data.style) : null,
        style_labels: data.style_labels ? JSON.stringify(data.style_labels) : null,
        avatar: data.avatar || null,
      },
    });
    return { ...contact, id: Number(contact.id) };
  }

  async update(id: number, openid: string, data: {
    nickname?: string;
    identities?: string[];
    identity_labels?: string[];
    target?: string[];
    target_labels?: string[];
    style?: string[];
    style_labels?: string[];
    avatar?: string;
  }) {
    // 先检查联系人是否存在且属于该用户
    const existing = await this.prisma.contact.findFirst({
      where: { id, openid },
    });
    if (!existing) {
      throw new NotFoundException('联系人不存在或无权操作');
    }

    const updateData: any = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname.trim();
    if (data.identities !== undefined) updateData.identities = data.identities.length ? JSON.stringify(data.identities) : null;
    if (data.identity_labels !== undefined) updateData.identity_labels = data.identity_labels.length ? JSON.stringify(data.identity_labels) : null;
    if (data.target !== undefined) updateData.target = data.target.length ? JSON.stringify(data.target) : null;
    if (data.target_labels !== undefined) updateData.target_labels = data.target_labels.length ? JSON.stringify(data.target_labels) : null;
    if (data.style !== undefined) updateData.style = data.style.length ? JSON.stringify(data.style) : null;
    if (data.style_labels !== undefined) updateData.style_labels = data.style_labels.length ? JSON.stringify(data.style_labels) : null;
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;

    const contact = await this.prisma.contact.update({
      where: { id },
      data: updateData,
    });
    return { ...contact, id: Number(contact.id) };
  }

  async getDetail(id: number, openid: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, openid },
    });
    if (!contact) {
      throw new NotFoundException('联系人不存在或无权操作');
    }
    return { ...contact, id: Number(contact.id) };
  }

  async delete(id: number, openid: string) {
    const result = await this.prisma.contact.deleteMany({
      where: { id, openid },
    });
    if (result.count === 0) {
      throw new NotFoundException('联系人不存在或无权操作');
    }
    return {};
  }
}
