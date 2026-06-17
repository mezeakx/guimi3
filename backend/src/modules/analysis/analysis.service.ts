// backend/src/modules/analysis/analysis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface AnalysisResult {
  reply_A: string;
  reply_B: string;
  reply_C: string;
  boy_intent: string;
  risk_warning: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly aiApiKey = process.env.AI_API_KEY;
  private readonly aiBaseUrl = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';

  async analyze(openid: string, data: {
    message: string;
    context?: string;
    identity?: string;
    target?: string;
    style?: string;
  }): Promise<{ success: boolean; data: AnalysisResult }> {
    const systemPrompt = this.buildSystemPrompt(data);

    try {
      // 调用 AI
      const response = await axios.post(
        `${this.aiBaseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: data.message },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.aiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 清洗 Markdown
      let content = response.data.choices[0].message.content;
      content = content.replace(/`json/g, '').replace(/`/g, '').trim();

      // 解析 JSON
      try {
        const result: AnalysisResult = JSON.parse(content);
        return { success: true, data: result };
      } catch {
        // 解析失败，返回兜底
        return { success: true, data: this.getFallbackResult() };
      }
    } catch (error) {
      this.logger.error('AI 调用失败:', error);
      // 返回兜底结果
      return { success: true, data: this.getFallbackResult() };
    }
  }

  private buildSystemPrompt(data: any): string {
    return `你是一位成熟理性的女性聊天军师。

请根据以下信息提供回复建议：
1. 男生身份：${data.identity || '未指定'}
2. 回复目标：${data.target || '未指定'}
3. 回复风格：${data.style || '未指定'}
4. 聊天内容：${data.message}
5. 前情提要：${data.context || '无'}

输出要求：
- 3 条回复建议
- 男生的可能意图分析
- 风险提醒

禁止：PUA、情感操控、虚假承诺、攻击性表达

统一返回 JSON 格式：
{
  "reply_A": "...",
  "reply_B": "...",
  "reply_C": "...",
  "boy_intent": "...",
  "risk_warning": "..."
}`;
  }

  private getFallbackResult(): AnalysisResult {
    return {
      reply_A: '哈哈刚看到消息～',
      reply_B: '最近有点忙呢～',
      reply_C: '谢谢你的消息～',
      boy_intent: '暂时无法分析',
      risk_warning: '系统繁忙，请稍后重试',
    };
  }
}
