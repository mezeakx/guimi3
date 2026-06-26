// backend/src/modules/analysis/analysis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ContentSafetyService } from '../content-safety/content-safety.service';

export interface AnalysisResult {
  thinking: string;
  thinkingTags: string[];
  remind: string;
  remindTags: string[];
  replies: Array<{
    text: string;
    style: string;
    active: number;
    good: number;
    rhythm: string;
  }>;
  themeReplies?: Array<{
    mode: string;
    messages: string[];
    sendHint: string;
  }>;
  communicationTip?: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly aiApiKey = process.env.AI_API_KEY;
  private readonly aiBaseUrl = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
  private readonly contentSafety = new ContentSafetyService();
  // 开发模式：当 AI_KEY 为占位符时，使用模拟数据
  private readonly devMode =
    !process.env.AI_API_KEY || process.env.AI_API_KEY === 'your-ai-api-key';

  async analyze(openid: string, data: {
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
  }): Promise<AnalysisResult> {
    // 1. 输入内容安全审核
    const inputMessages = [data.message, data.context, data.thoughtCustom].filter(Boolean).join('\n');
    const inputCheck = await this.contentSafety.msgSecCheck(inputMessages);
    if (!inputCheck.passed) {
      this.logger.warn('输入内容审核不通过:', inputCheck.reason);
      return {
        thinking: '内容审核未通过',
        thinkingTags: ['违规内容'],
        remind: '您提交的内容包含不合规信息，请修改后重试',
        remindTags: ['请遵守平台规范'],
        replies: [
          { text: '请修改您的输入后重试', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '内容无法识别，请重新输入', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '抱歉，该内容暂无法分析', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '请修改您的输入后重试', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '抱歉，该内容暂无法分析', style: '自然', active: 1, good: 1, rhythm: '自然' },
        ],
      };
    }

    // 2. 开发模式：使用模拟数据，不调用 AI
    if (this.devMode) {
      this.logger.log('开发模式：返回模拟数据');
      return this.getMockResult(data);
    }

    const systemPrompt = this.buildSystemPrompt(data);

    try {
      this.logger.log('开始调用 AI API: ' + this.aiBaseUrl + '/chat/completions');
      const startTime = Date.now();

      const response = await axios.post(
        this.aiBaseUrl + '/chat/completions',
        {
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: data.message },
          ],
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.aiApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 90000,
        },
      );

      const elapsed = Date.now() - startTime;
      this.logger.log('AI API 调用成功，耗时: ' + elapsed + 'ms');
      this.logger.log('AI 返回 choices 数量:', response.data.choices?.length);
      if (response.data.choices && response.data.choices.length > 0) {
        this.logger.log('第一个 choice finish_reason:', response.data.choices[0].finish_reason);
      }

      // 清洗 Markdown 代码块标记
      let content = response.data.choices?.[0]?.message?.content || '';

      // 如果 content 为空，尝试从 reasoning_content 中提取 JSON
      if (!content) {
        const reasoning = response.data.choices?.[0]?.message?.reasoning_content || '';
        if (reasoning) {
          this.logger.log('从 reasoning_content 提取 JSON');
          // reasoning_content 可能包含中文描述 + JSON，尝试找到合法的 JSON
          // 先找 "replies" 字段，从那里往回找 JSON 的起始 {
          const repliesIdx = reasoning.toLowerCase().indexOf('"replies"');
          if (repliesIdx > 0) {
            let braceStart = repliesIdx - 1;
            while (braceStart >= 0 && reasoning[braceStart] !== '{') braceStart--;
            if (braceStart >= 0) {
              const candidate = reasoning.substring(braceStart);
              const jsonMatch = candidate.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                content = jsonMatch[0];
              }
            }
          }
          if (!content) {
            const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
            if (jsonMatch) content = jsonMatch[0];
          }
        }
      }

      if (!content) {
        this.logger.error('AI 返回内容为空，完整响应:', JSON.stringify(response.data).substring(0, 500));
        return this.getFallbackResult();
      }
      content = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      // 替换中文冒号为英文冒号（deepseek-v4-flash 可能输出中文标点）
      content = content.replace(/：/g, ':');

      // 提取最外层 JSON 对象（贪婪匹配，确保嵌套的 replies 数组不被截断）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      // 如果清洗后仍为空，返回 fallback
      if (!content.trim()) {
        this.logger.warn('AI 返回内容清洗后为空，使用 fallback');
        return this.getFallbackResult();
      }

      // 解析 JSON，如果失败则尝试修复截断的 JSON
      try {
        const result: AnalysisResult = JSON.parse(content);

        // 输出内容安全审核
        const outputText = [result.thinking, result.remind, ...(result.replies?.map((r: any) => r.messages?.[0] || r.text) || [])].join('\n');
        try {
          const outputCheck = await this.contentSafety.msgSecCheck(outputText);
          if (!outputCheck.passed) {
            this.logger.warn('AI 输出内容审核不通过:', outputCheck.reason);
            return this.getFallbackResult();
          }
        } catch (safetyError) {
          this.logger.error('内容安全审核异常:', safetyError instanceof Error ? safetyError.message : safetyError);
          // 审核失败时放行，不阻塞主流程
        }

        // 检测是否为新格式（主题卡片模式：replies 数组中的对象有 mode/messages 字段）
        const isNewFormat = result.replies
          && Array.isArray(result.replies)
          && result.replies.length >= 1
          && typeof result.replies[0] === 'object'
          && 'mode' in result.replies[0];

        if (isNewFormat) {
          // 新格式：将 themeReplies 转为 replies 兼容格式
          const themeReplies = result.replies as any[];
          result.replies = themeReplies
            .slice(0, 5)
            .map((r) => ({
              text: r.messages?.[0] || r.text || '',
              style: r.mode || '自然',
              active: 2,
              good: 4,
              rhythm: '自然'
            }))
            .filter((r) => r.text && r.text.trim().length > 0);
          result.themeReplies = themeReplies;
          result.communicationTip = result.communicationTip || '';

          // 补齐到 5 条
          const padDefaults = [
            { text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
            { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
            { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
            { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
            { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
          ];
          while (result.replies.length < 5) {
            result.replies.push(padDefaults[result.replies.length]);
          }

          // 补齐分析字段
          if (!result.thinkingTags || !Array.isArray(result.thinkingTags)) result.thinkingTags = [];
          if (!result.remindTags || !Array.isArray(result.remindTags)) result.remindTags = [];
          const [thinking, remind] = await Promise.all([
            result.thinking ? Promise.resolve(result.thinking) : this.generateThinking(data),
            result.remind ? Promise.resolve(result.remind) : this.generateRemind(data),
          ]);
          result.thinking = thinking || '对方主动联系你，希望能继续互动。';
          result.remind = remind || '保持自然节奏，观察对方投入程度。';

          this.logger.log('AI 分析成功（主题卡片模式），thinking 长度:', result.thinking?.length);
          this.logger.log('AI 分析成功，themeReplies count:', result.themeReplies?.length);
          return result;
        }

        // ===== 以下是旧格式处理逻辑（保留兼容）=====
        // 过滤空文本
        result.replies = result.replies.filter((r) => r.text && r.text.trim().length > 0);

        // 补齐 replies 字段
        result.replies = result.replies.slice(0, 5).map((r) => ({
          text: r.text || '',
          style: r.style || '自然',
          active: Number(r.active) || 2,
          good: Number(r.good) || 4,
          rhythm: r.rhythm || '自然',
        }));

        // 如果 AI 只返回了少于 3 条回复，用有意义的默认值补齐
        const padDefaults = [
          { text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
          { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
          { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
          { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
          { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
        ];
        while (result.replies.length < 5) {
          result.replies.push(padDefaults[result.replies.length]);
        }

        // 补齐分析字段
        if (!result.thinkingTags || !Array.isArray(result.thinkingTags)) result.thinkingTags = [];
        if (!result.remindTags || !Array.isArray(result.remindTags)) result.remindTags = [];

        // 并行生成 thinking/remind（如果 AI 没返回就调用独立 AI 生成，否则用默认值）
        const [thinking, remind] = await Promise.all([
          result.thinking ? Promise.resolve(result.thinking) : this.generateThinking(data),
          result.remind ? Promise.resolve(result.remind) : this.generateRemind(data),
        ]);
        result.thinking = thinking || '对方主动联系你，希望能继续互动。';
        result.remind = remind || '保持自然节奏，观察对方投入程度。';

        this.logger.log('AI 分析成功，thinking 长度:', result.thinking?.length);
        this.logger.log('AI 分析成功，replies count:', result.replies?.length);
        return result;
      } catch (parseError) {
        this.logger.error('AI 返回内容 JSON 解析失败:', parseError instanceof Error ? parseError.message : parseError);
        this.logger.error('原始内容预览:', content.substring(0, 300));
        // 尝试修复截断的 JSON
        try {
          const fixedContent = this.fixTruncatedJson(content);
          if (fixedContent) {
            const fixedResult: AnalysisResult = JSON.parse(fixedContent);
            this.logger.log('JSON 修复成功');
            this.logger.log('修复后 thinking:', fixedResult.thinking);
            this.logger.log('修复后 remind:', fixedResult.remind);
            this.logger.log('修复后 replies count:', fixedResult.replies?.length);
            // 补齐缺失字段
            if (!fixedResult.replies || !Array.isArray(fixedResult.replies)) {
              fixedResult.replies = this.getDefaultReplies();
            } else {
              // 补齐不足的回复，用有内容的默认值
              const defaults = [
                { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
                { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
                { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
                { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
                { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
              ];
              while (fixedResult.replies.length < 5) {
                fixedResult.replies.push(defaults[fixedResult.replies.length]);
              }
            }
            // 确保 thinking/remind 始终有值（JSON.stringify 会丢弃 undefined）
            if (!fixedResult.thinking) fixedResult.thinking = '对方主动联系你，希望能继续互动。';
            if (!fixedResult.remind) fixedResult.remind = '保持自然节奏，观察对方投入程度。';
            if (!fixedResult.thinkingTags) fixedResult.thinkingTags = [];
            if (!fixedResult.remindTags) fixedResult.remindTags = [];
            // 异步补充 thinking/remind（用默认值保底，不影响返回）
            const thinkingPromise = !fixedResult.thinking ? this.generateThinking(data) : Promise.resolve('');
            const remindPromise = !fixedResult.remind ? this.generateRemind(data) : Promise.resolve('');
            Promise.all([thinkingPromise, remindPromise]).then(([t, r]) => {
              if (t) fixedResult.thinking = t;
              if (r) fixedResult.remind = r;
            }).catch(() => {});
            return fixedResult;
          }
        } catch (fixError) {
          this.logger.error('JSON 修复也失败:', fixError instanceof Error ? fixError.message : fixError);
        }
        return this.getFallbackResult();
      }
    } catch (error) {
      this.logger.error('AI 调用失败:', error);
      return this.getFallbackResult();
    }
  }

  private escapeTemplateValue(value: string | undefined): string {
    if (!value) return '';
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/[\x00-\x1f]/g, (c) => {
        const hex = c.charCodeAt(0).toString(16).padStart(4, '0');
        return '\\u' + hex;
      });
  }

  private buildSystemPrompt(data: any): string {
    const safe = (v: string | undefined): string => this.escapeTemplateValue(v) || '未指定';
    const safeArr = (arr: string[] | undefined): string => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return '未指定';
      return arr.join('、');
    };
    const safeCtx = (v: string | undefined): string => this.escapeTemplateValue(v) || '无';

    // 聊天节奏描述
    const paceDescriptions: Record<number, { name: string; desc: string }> = {
      0: { name: '直球模式', desc: '有话直说，不绕弯子，直接表达需求和想法' },
      25: { name: '自然模式', desc: '真实表达，不刻意设计，像日常聊天一样自然' },
      50: { name: '慢热模式', desc: '表达但保留空间，不急于推进关系' },
      75: { name: '暧昧模式', desc: '不说透，让对方接话，制造一点暧昧感' },
      100: { name: '拉扯模式', desc: '制造猜测，保留神秘感，让对方主动追问' },
    };
    const pace = data.pace != null ? paceDescriptions[data.pace] : paceDescriptions[25];
    const paceDesc = pace ? `${pace.name}(${pace.desc})` : '自然模式(真实表达，不刻意设计)';

    // 人设描述
    const personaDescriptions: Record<string, string> = {
      '普通女生': '喜欢自然真实地聊天，不会刻意撩人，也不会故意高冷，表达舒服有礼貌',
      '纯情女大': '容易害羞，不太会主动，喜欢慢慢熟悉，不喜欢太直接，偶尔会嘴硬但其实很好哄',
      '温柔姐姐': '喜欢用温柔体贴的方式表达，很少发脾气，不喜欢争吵，注重照顾对方感受',
      '元气少女': '喜欢轻松愉快地聊天，经常使用表情和感叹词，热情开朗，擅长制造聊天氛围',
      '甜妹': '喜欢可爱软萌的表达方式，经常使用颜文字表情和语气词，偶尔会撒娇',
      '钓系御姐': '不会把喜欢表现得太明显，擅长制造若即若离的感觉，偶尔会撩人但保持分寸',
      '霸气女王': '说话自信有主见，不喜欢讨好别人，不会委屈自己，喜欢平等直接的交流',
      '酷女孩': '不喜欢矫情和过度拉扯，态度随性偶尔耍酷，更喜欢像朋友一样自然相处',
      '成熟理性派': '更注重逻辑和沟通效率，很少情绪化表达，遇到问题喜欢直接沟通解决',
      '抽象搞笑女': '喜欢玩梗接梗和整活，聊天主打有趣，即使表达喜欢也会带点幽默感',
    };
    const personaDesc = data.persona ? (personaDescriptions[data.persona] || personaDescriptions['普通女生']) : personaDescriptions['普通女生'];

    // 回复目标描述
    const targetDescriptions: Record<string, string> = {
      '了解': '先了解他，保持好奇心和观察',
      'flirt': '提升好感，适当表达关心和欣赏',
      'ambiguous': '保持暧昧，营造心照不宣的氛围',
      'proactive': '让他主动，引导他投入更多精力',
      'friend': '保持朋友关系，有礼貌但有边界',
      'reject': '委婉拒绝，不伤害对方但明确立场',
    };
    const targetDesc = data.targets && data.targets.length > 0
      ? data.targets.map((t: string) => targetDescriptions[t] || t).join('、')
      : '根据具体情况灵活应对';

    // 回复风格描述
    const styleDescriptions: Record<string, string> = {
      'gentle': '温柔',
      'humor': '幽默',
      'cold': '高冷',
      'cute': '可爱',
      'mature': '成熟姐姐',
      'rational': '理性',
      'casual': '自然随性',
      'flirt': '撩人',
      'tsundere': '傲娇',
      'friendly': '友善',
      'praise': '夸夸',
      'roast': '吐槽',
    };
    const styleDesc = data.styles && data.styles.length > 0
      ? data.styles.map((s: string) => styleDescriptions[s] || s).join('、')
      : '自然';

    // 想法描述
    const thoughtDesc = [
      data.thoughtCategories ? safeArr(data.thoughtCategories) : null,
      data.thoughtCustom ? this.escapeTemplateValue(data.thoughtCustom) : null,
    ].filter(Boolean).join('，') || '无特殊想法';

    // 关系状态
    const relationshipDesc = data.relationshipOptions && data.relationshipOptions.length > 0
      ? safeArr(data.relationshipOptions)
      : '未指定';

    let prompt = '你是一位经验丰富的女性聊天军师，名叫"闺蜜"。你帮助用户分析聊天对话并生成高情商的回复建议。\n\n';
    prompt += '## 用户当前设定\n\n';
    prompt += '### 我的人设\n' + (data.persona || '普通女生') + '：' + personaDesc + '\n\n';
    prompt += '### 聊天节奏\n' + paceDesc + '\n\n';
    prompt += '### 回复风格\n' + styleDesc + '\n\n';
    prompt += '### 回复目标\n' + targetDesc + '\n\n';
    prompt += '### 他的身份\n' + (safeArr(data.identity_labels || data.identities) || safe(data.identity) || '未指定') + '\n\n';
    prompt += '### 我们的关系状态\n' + relationshipDesc + '\n\n';
    prompt += '### 我的想法和情绪\n' + thoughtDesc + '\n\n';
    prompt += '### 前情提要\n' + (safeCtx(data.context) || '无') + '\n\n';
    prompt += '### 对方的消息\n' + (safe(data.message) || '请根据上下文理解') + '\n\n';
    prompt += '## 任务\n\n请根据对方的消息内容和上下文，从以下 8 大类 100 种回复模式中选出 **恰好 5 种** 最适合当前场景的模式，并为每种模式生成 2 条具体回复文案。\n\n';
    prompt += '可选模式范围（共 100 种，分布在 8 个大类中）：\n';
    prompt += '- 撩系：小狐狸模式、钓系模式、反撩模式、欲擒故纵、暗撩、情绪拉扯、暧昧引导、软钩子、氛围制造…\n';
    prompt += '- 冷感：冷脸模式、冷处理、高墙模式、极简回复、冷幽默、克制回应…\n';
    prompt += '- 怼人：拿捏模式、阴阳模式、毒舌模式、反杀、冷刀、回踩、反向输出…\n';
    prompt += '- 软萌：奶凶模式、委屈模式、撒娇反抗、软顶嘴、软刺、小炸毛…\n';
    prompt += '- 摆烂：摆烂模式、佛系、躺平、低电量、已读不回、延迟回应…\n';
    prompt += '- 掌控：控场模式、节奏掌控、规则制定、主导提问、压制推进…\n';
    prompt += '- 作精：作精模式、戏精、小剧场、情绪放大、夸张委屈、反复横跳…\n';
    prompt += '- 调侃：拽姐模式、调戏、互损、打趣、反讽调侃、语言戏弄…\n\n';

    prompt += '选择规则：\n';
    prompt += '1. 5 个模式之间风格差异要大，不要选同一种类型的\n';
    prompt += '2. 要结合对方的语气来选择——对方撩你就要选撩系模式，对方挑衅就要选怼人模式\n';
    prompt += '3. 要符合我的人设、我的想法和回复目标\n';
    prompt += '4. 5 个模式中至少要包含：1 个稳妥型 + 1 个主动型 + 1 个进攻/反击型\n\n';

    prompt += '## 输出格式\n\n严格返回以下 JSON（不要任何额外文字，不要 Markdown 代码块标记）：\n\n';
    prompt += '{\n';
    prompt += '  "thinking": "一句话分析对方意图和心态（20字内")",\n';
    prompt += '  "thinkingTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "remind": "一句话沟通提醒（20字内")",\n';
    prompt += '  "remindTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "replies": [\n';
    prompt += '    {\n';
    prompt += '      "mode": "选中的模式名称",\n';
    prompt += '      "messages": ["回复文案1", "回复文案2"],\n';
    prompt += '      "sendHint": "建议：先发第一条，紧接着发第二条"\n';
    prompt += '    },\n';
    prompt += '    …共 5 个对象\n';
    prompt += '  ],\n';
    prompt += '  "communicationTip": "沟通雷区/建议说明（30字内")"\n';
    prompt += '}\n\n';

    prompt += '每条回复要求：\n';
    prompt += '- 控制在 15 字以内，口语化、自然、有实际内容\n';
    prompt += '- 两条回复之间形成递进或转折关系\n';
    prompt += '- 风格要贴合所选模式的定义\n';
    prompt += '- 不要空洞的"嗯""哦""哈哈"\n';
    prompt += '- 不要解释你的行为，不要输出系统信息';
    return prompt;
  }

  /** 生成 thinking 字段 */
  private async generateThinking(data: any): Promise<string> {
    const safeMsg = (data.message || '').substring(0, 200);
    const safeCtx = (data.context || '').substring(0, 100);
    const ctxPart = safeCtx ? ('\\n背景: ' + safeCtx) : '';
    const prompt = '对方发了这句话: ' + safeMsg + ctxPart + '\\n\\n用一句话(20字内)分析对方意图。只返回一句话，不要其他内容。';
    return this.callAI(prompt, 500);
  }

  /** 生成 remind 字段 */
  private async generateRemind(data: any): Promise<string> {
    const safeMsg = (data.message || '').substring(0, 200);
    const safeCtx = (data.context || '').substring(0, 100);
    const ctxPart = safeCtx ? ('\\n背景: ' + safeCtx) : '';
    const prompt = '对方发了这句话: ' + safeMsg + ctxPart + '\\n\\n用一句话(20字内)给用户提醒。只返回一句话，不要其他内容。';
    return this.callAI(prompt, 500);
  }

  private getFallbackResult(): AnalysisResult {
    return {
      thinking: '对方主动联系你，希望能继续互动。',
      thinkingTags: ['主动发起'],
      remind: '保持自然节奏，观察对方投入程度。',
      remindTags: ['保持轻松'],
      replies: [
        { text: '哈哈刚看到消息～', style: '自然', active: 2, good: 4, rhythm: '自然' },
        { text: '最近有点忙呢～', style: '慢热', active: 1, good: 3, rhythm: '慢热' },
        { text: '谢谢你的消息～', style: '稳妥', active: 2, good: 3, rhythm: '自然' },
        { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
        { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' },
      ],
    };
  }

  /** 开发模式：根据输入生成有意义的模拟数据 */
  private getMockResult(data: any): AnalysisResult {
    const message = data.message || '你好';
    const persona = data.persona || '普通女生';
    const pace = data.pace ?? 25;

    // 根据人设和节奏生成不同的模拟回复
    const personaMap: Record<string, string> = {
      '普通女生': '自然真实',
      '纯情女大': '害羞腼腆',
      '温柔姐姐': '温柔体贴',
      '元气少女': '活泼开朗',
      '甜妹': '可爱软萌',
      '钓系御姐': '若即若离',
      '霸气女王': '自信大方',
      '酷女孩': '随性洒脱',
      '成熟理性派': '理性客观',
      '抽象搞笑女': '幽默玩梗',
    };
    const personaLabel = personaMap[persona] || '自然真实';

    const paceMap: Record<number, { name: string; desc: string }> = {
      0: { name: '直球', desc: '直接回应' },
      25: { name: '自然', desc: '轻松自然' },
      50: { name: '慢热', desc: '保留空间' },
      75: { name: '暧昧', desc: '制造暧昧' },
      100: { name: '拉扯', desc: '制造悬念' },
    };
    const paceLabel = paceMap[pace]?.name || '自然';

    const hasPlayful = /猪|笨|傻|呆|丑|胖|懒/i.test(message);
    const hasInvite = /出来|一起|见面|吃饭|看电影|逛街|约|去/.test(message);
    const hasFlirt = /喜欢|爱|想|宝贝|亲爱的|老婆|老公|帅|美/.test(message);

    let thinkingText = '';
    let remindText = '';
    let communicationTipText = '';

    if (hasPlayful) {
      thinkingText = '他在用玩笑逗你，说明想拉近关系，氛围很轻松。';
      remindText = '别当真别生气，顺着玩笑接就好，保持轻松氛围。';
      communicationTipText = '对方明显在开玩笑逗你，顺着他的玩笑往下接，把氛围带得更轻松或更暧昧才是正解。';
    } else if (hasInvite) {
      thinkingText = '他主动约你出去，说明对你有好感，想推进关系。';
      remindText = '先观察他的态度和诚意，不要马上答应，保持一点神秘感。';
      communicationTipText = '他主动邀约是好信号，但不要太快答应，保持一点矜持会让对方更珍惜。';
    } else if (hasFlirt) {
      thinkingText = '他在表达好感，语气比较直接，期待你的回应。';
      remindText = '可以根据你的人设选择回应方式，不要太快暴露太多需求感。';
      communicationTipText = '对方在表达好感，保持你的人设节奏，不要过度热情也不要太冷淡。';
    } else {
      thinkingText = '他主动联系你，简单聊了几句，大概率希望继续推进关系。';
      remindText = '保持自然节奏，观察对方投入程度，不要急于回复。';
      communicationTipText = '对方主动找你聊天，保持自然回应就好，不用太刻意。';
    }

    const thinkingTags = ['对' + personaLabel + '有好感', '想继续话题', '期待回应'];

    const themeReplies = [
      {
        mode: '奶凶模式',
        messages: hasPlayful
          ? ['你才是呢', '本仙女明明是小香猪']
          : ['谁理你呀', '自己想办法'],
        sendHint: '建议先发第一条，紧接着发第二条'
      },
      {
        mode: '拽姐模式',
        messages: hasPlayful
          ? ['哼', '那也是你惯出来的']
          : ['哦', '然后呢'],
        sendHint: '建议先发第一条，紧接着发第二条'
      },
      {
        mode: '反撩模式',
        messages: hasPlayful
          ? ['猪怎么啦', '拱你这颗大白菜刚刚好']
          : ['怎么突然找我', '不会无事不登三宝殿吧'],
        sendHint: '建议先发第一条，紧接着发第二条'
      },
      {
        mode: '摆烂模式',
        messages: hasPlayful
          ? ['嗯，是猪', '那你是养猪专业户吗']
          : ['嗯嗯', '你说得都对'],
        sendHint: '建议先发第一条，紧接着发第二条'
      },
      {
        mode: '冷脸模式',
        messages: hasPlayful
          ? ['啧', '你见过凌晨一点还这么美的猪吗']
          : ['？', '有事说事'],
        sendHint: '建议先发第一条，紧接着发第二条'
      },
    ];

    const legacyReplies = [
      {
        text: hasInvite
          ? '哈哈可以呀～不过我对这边不太熟，你有什么推荐吗？'
          : '哈哈好的呀～',
        style: themeReplies[0].mode,
        active: 2,
        good: 4,
        rhythm: '自然',
      },
      {
        text: hasInvite
          ? '听起来还不错～有机会可以一起去看看呀～'
          : '嗯嗯，知道了～',
        style: themeReplies[1].mode,
        active: 3,
        good: 5,
        rhythm: '稍快',
      },
      {
        text: hasFlirt
          ? '怎么突然这么说啦～'
          : '怎么突然想约我啦～',
        style: themeReplies[2].mode,
        active: 1,
        good: 3,
        rhythm: '慢热',
      },
      {
        text: '哈哈哈笑死我了',
        style: themeReplies[3].mode,
        active: 4,
        good: 5,
        rhythm: '积极',
      },
      {
        text: '？',
        style: themeReplies[4].mode,
        active: 1,
        good: 2,
        rhythm: '被动',
      },
    ];

    return {
      thinking: thinkingText,
      thinkingTags: thinkingTags,
      remind: remindText,
      remindTags: ['保持轻松自然'],
      replies: legacyReplies,
      themeReplies: themeReplies,
      communicationTip: communicationTipText,
    };
  }

  /** 尝试修复被截断的 JSON */
  private fixTruncatedJson(json: string): string | null {
    if (!json) return null;

    const trimmed = json.trim().replace(/：/g, ':');

    // 如果已经合法，直接返回
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      // 继续尝试修复
    }

    // 策略1: 从末尾往前找最后一个完整的 JSON 值（数字、引号字符串、布尔值、null）
    // 截断通常发生在逗号后面，比如 "good": 4, 后面没了
    let fixed = trimmed;

    // 去掉末尾的逗号
    fixed = fixed.replace(/,\s*$/, '');

    // 尝试找最后一个完整的 } 来截断
    // 逐层往里找：先试去掉末尾部分直到找到一个合法的 }
    for (let i = fixed.length - 1; i >= 0; i--) {
      if (fixed[i] === '}') {
        const candidate = fixed.substring(0, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // 继续往前找
        }
      }
    }

    // 策略2: 如果上面都不行，尝试从 "replies" 处截断
    // 优先提取已有的 replies（保留 AI 实际生成的内容），thinking/remind 用默认值补齐
    const repliesIdx = fixed.indexOf('"replies"');
    if (repliesIdx > 0) {
      const prefix = fixed.substring(0, repliesIdx).trim();
      const cleanPrefix = prefix.replace(/,\s*$/, '');
      // 用正则提取 thinking/remind，不依赖 JSON.parse
      // 注意：reasoning_content 中 thinking 可能是中文文本而非 JSON 字段
      const extractField = (fieldName: string): string | null => {
        const match = cleanPrefix.match(new RegExp('"' + fieldName + '"\\s*:\\s*"([^"]*)'));
        if (match) return match[1];
        const match2 = cleanPrefix.match(new RegExp(fieldName + '\\s*[：:]\\s*([^\\n，,\\]]+)'));
        if (match2) return match2[1].trim();
        return null;
      };
      const extractArray = (fieldName: string): string[] => {
        const match = cleanPrefix.match(new RegExp('"' + fieldName + '"\\s*:\\s*\\[([^\\]]*)'));
        if (!match) {
          const match2 = cleanPrefix.match(new RegExp(fieldName + '\\s*[：:]\\s*([^\\n，\\]]+)'));
          if (match2) return match2[1].split(/[,\，]/).map((s: string) => s.trim()).filter(Boolean);
          return [];
        }
        return match[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
      };
      const thinking = extractField('thinking') || '对方主动联系你，希望能继续互动。';
      const thinkingTags = extractArray('thinkingTags') || [];
      const remind = extractField('remind') || '保持自然节奏，观察对方投入程度。';
      const remindTags = extractArray('remindTags') || [];

      // 从 "replies" 之后的内容中提取已有回复（复用策略4的正则）
      const repliesContent = fixed.substring(repliesIdx + '"replies"'.length);
      const existingReplies: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];
      let repRemaining = repliesContent;
      while (repRemaining) {
        const objMatch = repRemaining.match(/\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/);
        if (objMatch) {
          const rhythmMatch = repRemaining.match(/"rhythm"\s*:\s*"([^"]*)/);
          existingReplies.push({
            text: objMatch[1],
            style: objMatch[2],
            active: Number(objMatch[3]),
            good: Number(objMatch[4]),
            rhythm: rhythmMatch ? rhythmMatch[1] : '自然'
          });
          const nextBrace = repRemaining.indexOf('{', 1);
          if (nextBrace > 0) {
            repRemaining = repRemaining.substring(nextBrace);
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // 补齐到 5 条：优先用 AI 的实际回复，不足再用默认值
      const defaultReplies = [
        { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
        { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
        { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
        { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
        { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
      ];
      while (existingReplies.length < 5) {
        existingReplies.push(defaultReplies[existingReplies.length]);
      }

      return JSON.stringify({
        thinking,
        thinkingTags,
        remind,
        remindTags,
        'replies': existingReplies
      });
    } // 关闭策略2的 if (repliesIdx > 0) 块

    // 策略3: 暴力截断——从末尾逐步去掉字符直到合法
    for (let cut = 1; cut < trimmed.length; cut += 5) {
      const sub = trimmed.substring(0, trimmed.length - cut).replace(/,\s*$/, '');
      try {
        JSON.parse(sub);
        return sub;
      } catch {
        // 继续
      }
    }

    // 策略4: 专门处理 replies 数组被截断的情况
    // 提取已有的 replies 内容，用默认回复补齐
    const repliesMatch = trimmed.match(/"replies"\s*:\s*\[/);
    if (repliesMatch) {
      const repliesStart = repliesMatch.index! + repliesMatch[0].length;
      const repliesContent = trimmed.substring(repliesStart);

      // 尝试从 repliesContent 中提取已有回复
      const existingReplies: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];

      // 逐个提取已有回复对象
      let remaining = repliesContent;
      while (remaining) {
        // 放宽正则，允许末尾不闭合
        const objMatch = remaining.match(/\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/);
        if (objMatch) {
          const rhythmMatch = remaining.match(/"rhythm"\s*:\s*"([^"]*)/);
          existingReplies.push({
            text: objMatch[1],
            style: objMatch[2],
            active: Number(objMatch[3]),
            good: Number(objMatch[4]),
            rhythm: rhythmMatch ? rhythmMatch[1] : '自然'
          });
          // 跳到下一个对象
          const nextBrace = remaining.indexOf('{', 1);
          if (nextBrace > 0) {
            remaining = remaining.substring(nextBrace);
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (existingReplies.length > 0) {
        // 补齐到 5 条，用有内容的默认回复
        const defaultReplies = [
          { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
          { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
          { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
          { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
          { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
        ];
        while (existingReplies.length < 5) {
          existingReplies.push(defaultReplies[existingReplies.length]);
        }

        // 提取 prefix（replies 之前的部分）
        const prefix = trimmed.substring(0, repliesMatch.index!).replace(/,\s*$/, '');

        // 从 prefix 中用正则提取 thinking/remind，不依赖 JSON.parse（因为 prefix 可能不完整）
        // 注意：reasoning_content 中 thinking 可能是中文文本而非 JSON 字段
        const extractField = (fieldName: string): string | null => {
          const match = prefix.match(new RegExp('"' + fieldName + '"\\s*:\\s*"([^"]*)'));
          if (match) return match[1];
          // 也尝试不带头部引号的格式（reasoning_content 中的中文格式）
          const match2 = prefix.match(new RegExp(fieldName + '\\s*[：:]\\s*([^\\n，,\\]]+)'));
          if (match2) return match2[1].trim();
          return null;
        };
        const extractArray = (fieldName: string): string[] => {
          const match = prefix.match(new RegExp('"' + fieldName + '"\\s*:\\s*\\[([^\\]]*)'));
          if (!match) {
            // 尝试中文格式
            const match2 = prefix.match(new RegExp(fieldName + '\\s*[：:]\\s*([^\\n，\\]]+)'));
            if (match2) return match2[1].split(/[,\，]/).map((s: string) => s.trim()).filter(Boolean);
            return [];
          }
          return match[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
        };

        const thinking = extractField('thinking') || '对方主动联系你，希望能继续互动。';
        const thinkingTags = extractArray('thinkingTags') || [];
        const remind = extractField('remind') || '保持自然节奏，观察对方投入程度。';
        const remindTags = extractArray('remindTags') || [];

        return JSON.stringify({
          thinking,
          thinkingTags,
          remind,
          remindTags,
          replies: existingReplies
        });
      }
    }

    return null;
  }

  /** 获取默认回复数组 */
  private getDefaultReplies(): Array<{ text: string; style: string; active: number; good: number; rhythm: string }> {
    return [
      { text: '哈哈刚看到消息～', style: '自然', active: 2, good: 4, rhythm: '自然' },
      { text: '最近有点忙呢～', style: '慢热', active: 1, good: 3, rhythm: '慢热' },
      { text: '谢谢你的消息～', style: '稳妥', active: 2, good: 3, rhythm: '自然' },
      { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
      { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' },
    ];
  }

  /** 轻量级 AI 调用，用于生成简短文本 */
  private async callAI(userPrompt: string, maxTokens: number): Promise<string> {
    try {
      const response = await axios.post(
        this.aiBaseUrl + '/chat/completions',
        {
          model: 'deepseek-v4-flash',
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: maxTokens,
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.aiApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
      const text = response.data.choices?.[0]?.message?.content || '';
      return text.replace(/\\n/g, '').trim().substring(0, 50);
    } catch {
      return '对方主动联系你，希望能继续互动。';
    }
  }
}
