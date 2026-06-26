// backend/src/modules/analysis/analysis.controller.ts
import { Controller, Post, Body, Get, HttpCode, Req, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AnalysisService, AnalysisResult } from './analysis.service';
import { UserService } from '../user/user.service';
import { PrismaClient } from '@prisma/client';

@Controller('analysis')
@UseGuards(AuthGuard)
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly userService: UserService,
    private readonly prisma: PrismaClient,
  ) {}

  @Post('generate')
  @HttpCode(200)
  async generate(@Req() req: any, @Body() body: {
    message: string;
    context?: string;
    contact_id?: number;
    identity?: string;
    target?: string;
    style?: string;
    identities?: string[];
    identity_labels?: string[];
    targets?: string[];
    target_labels?: string[];
    styles?: string[];
    style_labels?: string[];
    pace?: number;
    persona?: string;
    thoughtCategories?: string[];
    thoughtCustom?: string;
    relationshipOptions?: string[];
  }) {
    const openid = req.user.openid;

    // 1. 记录使用
    await this.userService.recordUsage(openid);

    // 2. 调用 AI 分析
    const analysisResult: AnalysisResult = await this.analysisService.analyze(openid, body);

    // 3. 保存聊天记录
    try {
      await this.saveChatRecord(openid, body, analysisResult);
    } catch (err) {
      this.logger.error('保存聊天记录失败:', err);
      // 不阻塞主流程
    }

    return {
      data: analysisResult,
      remaining: 999,
    };
  }

  @Post('history')
  async getHistory(
    @Req() req: any,
    @Body() body: { page?: number; pageSize?: number },
  ) {
    const page = body.page || 1;
    const pageSize = body.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      this.prisma.chatRecord.findMany({
        where: { openid: req.user.openid },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.chatRecord.count({
        where: { openid: req.user.openid },
      }),
    ]);

    // Prisma BigInt 需要转为 number 才能 JSON 序列化
    const safeRecords = records.map((r) => ({ ...r, id: Number(r.id) }));
    return { records: safeRecords, total };
  }

  @Post('clear-history')
  async clearHistory(@Req() req: any) {
    await this.prisma.chatRecord.deleteMany({
      where: { openid: req.user.openid },
    });
    return {};
  }

  private async saveChatRecord(
    openid: string,
    body: any,
    analysisResult: any,
  ): Promise<void> {
    // 验证 contact_id 是否存在，不存在则置 null 避免外键约束失败
    let contactId: number | null = null;
    if (body.contact_id) {
      const contact = await this.prisma.contact.findUnique({
        where: { id: BigInt(body.contact_id) },
      });
      if (contact) {
        contactId = body.contact_id;
      }
    }

    await this.prisma.chatRecord.create({
      data: {
        openid,
        contactId,
        message: body.message || '',
        context: body.context || null,
        pace: body.pace || 25,
        persona: body.persona || null,
        thoughts: body.thoughtCategories ? JSON.stringify(body.thoughtCategories) : null,
        thoughtCustom: body.thoughtCustom || null,
        resultThinking: analysisResult.thinking || null,
        resultRemind: analysisResult.remind || null,
        resultReplies: analysisResult.replies ? JSON.stringify(analysisResult.replies) : null,
      },
    });
  }
}
