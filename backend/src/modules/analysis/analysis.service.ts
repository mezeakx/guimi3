// backend/src/modules/analysis/analysis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ContentSafetyService } from '../content-safety/content-safety.service';

// 100种回复模式列表（8大类）
const MODE_POOL = [
  '小狐狸模式', '猎心模式', '钓系模式', '诱导模式', '暗撩模式',
  '反撩模式', '欲擒故纵模式', '轻撩模式', '情绪拉扯模式',
  '心机试探模式', '暧昧引导模式', '软钩子模式', '反向示好模式',
  '欲言又止模式', '氛围制造模式',
  '冷脸模式', '冷处理模式', '高墙模式', '无回应模式',
  '极简回复模式', '冷暴风模式', '疏离模式', '冷静观察模式',
  '理性拆解模式', '冷眼旁观模式', '冷幽默模式', '克制回应模式',
  '冷淡反问模式', '冷收尾模式', '冷处理回避模式',
  '拿捏模式', '阴阳模式', '毒舌模式', '反杀模式', '回怼模式',
  '嘴硬模式', '逻辑压制模式', '反问压制模式', '反转攻击模式',
  '嘲讽模式', '讽刺模式', '冷刀模式', '回踩模式',
  '反向输出模式', '一击收尾模式',
  '奶凶模式', '委屈模式', '小脾气模式', '假生气模式', '嘟嘴模式',
  '软顶嘴模式', '装可怜模式', '撒娇反抗模式', '轻哼模式',
  '软刺模式', '假冷淡模式', '小炸毛模式', '依赖反击模式',
  '软反问模式', '情绪化回击模式',
  '摆烂模式', '无所谓模式', '躺平模式', '佛系模式', '低电量模式',
  '已读不回模式', '延迟回应模式', '半死不活模式', '社交倦怠模式',
  '能量节省模式',
  '控场模式', '规则制定模式', '节奏掌控模式', '信息筛选模式',
  '主导提问模式', '压制推进模式', '决策输出模式',
  '结构化回应模式', '权威语气模式', '结论优先模式',
  '作精模式', '情绪放大模式', '戏精模式', '夸张委屈模式',
  '反复横跳模式', '故意误解模式', '小剧场模式', '情绪递进模式',
  '假设推演模式', '情绪绑架模式',
  '拽姐模式', '调戏模式', '嘲笑模式', '反讽调侃模式',
  '玩笑攻击模式', '轻侮模式', '朋友互损模式', '打趣模式',
  '语言戏弄模式', '社交挑衅模式',
];


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
  private readonly devMode =
    !process.env.AI_API_KEY || process.env.AI_API_KEY === 'your-ai-api-key';

  async analyze(openid: string, data: {
    message: string; context?: string; contact_id?: number;
    identity?: string; target?: string; style?: string;
    identities?: string[]; identity_labels?: string[];
    targets?: string[]; target_labels?: string[];
    styles?: string[]; style_labels?: string[];
    pace?: number; persona?: string;
    thoughtCategories?: string[]; thoughtCustom?: string;
    relationshipOptions?: string[];
  }): Promise<AnalysisResult> {
    const inputMessages = [data.message, data.context, data.thoughtCustom].filter(Boolean).join('\n');
    const inputCheck = await this.contentSafety.msgSecCheck(inputMessages);
    if (!inputCheck.passed) {
      this.logger.warn('输入内容审核不通过:', inputCheck.reason);
      return { thinking: '内容审核未通过', thinkingTags: ['违规内容'],
        remind: '您提交的内容包含不合规信息，请修改后重试',
        remindTags: ['请遵守平台规范'],
        replies: [
          { text: '请修改您的输入后重试', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '内容无法识别，请重新输入', style: '自然', active: 1, good: 1, rhythm: '自然' },
          { text: '抱歉，该内容暂无法分析', style: '自然', active: 1, good: 1, rhythm: '自然' },
        ],
      };
    }

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
        { model: 'deepseek-v4-flash',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: data.message }],
        },
        { headers: { Authorization: 'Bearer ' + this.aiApiKey, 'Content-Type': 'application/json' }, timeout: 90000 },
      );

      const elapsed = Date.now() - startTime;
      this.logger.log('AI API 调用成功，耗时: ' + elapsed + 'ms');
      this.logger.log('AI 返回 choices 数量:', response.data.choices?.length);

      let content = response.data.choices?.[0]?.message?.content || '';
      let reasoning = response.data.choices?.[0]?.message?.reasoning_content ||
                        response.data.choices?.[0]?.message?.reasoning || '';
      if (!content && reasoning) {
        this.logger.log('From reasoning_content extract JSON');

        // Normalize Chinese/curly quotes to ASCII before extraction
        const DQ_N = String.fromCharCode(34);
        const SQ_N = String.fromCharCode(39);
        reasoning = reasoning.replace(/[\u201C\u201D\uFF02]/g, DQ_N)
                               .replace(/[\u2018\u2019]/g, SQ_N);

        const extractBalancedObj = (text, start) => {
          let depth = 0, inStr = false, esc = false;
          for (let i = start; i < text.length; i++) {
            const ch = text[i];
            if (esc) { esc = false; continue; }
            if (ch === '\\') { esc = true; continue; }
            if (ch === '"' && !esc) { inStr = !inStr; continue; }
            if (inStr) continue;
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (depth === 0) return text.substring(start, i + 1); }
          }
          return null;
        };

        const attachRepliesFromRest = (obj, rest) => {
          const trimmed = rest.trim();
          const m = trimmed.match(/^\,\s*"replies"\s*:\s*(\[)/);
          if (!m) return obj;
          let depth = 0, inStr = false, esc = false, arrEnd = -1;
          for (let i = 0; i < trimmed.length; i++) {
            const ct = trimmed[i];
            if (esc) { esc = false; continue; }
            if (ct === '\\') { esc = true; continue; }
            if (ct === '"' && !esc) { inStr = !inStr; continue; }
            if (inStr) continue;
            if (ct === '[') depth++;
            else if (ct === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
          }
          if (arrEnd >= 0) {
            const arrStr = trimmed.substring(0, arrEnd + 1);
            try {
              const parsed = JSON.parse(arrStr);
              if (Array.isArray(parsed)) {
                return obj.replace(/}$/, ', ' + DQ_N + 'replies' + DQ_N + ': ' + JSON.stringify(parsed) + '}');
              }
            } catch {}
          }
          return obj;
        };

        const ri = reasoning.toLowerCase().indexOf('"replies"');
        if (ri > 0) {
          let bs = ri - 1;
          while (bs >= 0 && reasoning[bs] !== '{') bs--;
          if (bs >= 0) {
            const obj = extractBalancedObj(reasoning, bs);
            if (obj) {
              const rest = reasoning.substring(bs + obj.length);
              content = attachRepliesFromRest(obj, rest);
            }
          }
        }

        if (!content) {
          const tr = reasoning.trim();
          for (let i = 0; i < tr.length; i++) {
            if (tr[i] === '{') {
              const obj = extractBalancedObj(tr, i);
              if (obj) { try { JSON.parse(obj); content = obj; break; } catch {} }
            }
          }
        }

        if (!content) {
          try { const p = JSON.parse(reasoning.trim()); if (p && typeof p === 'object' && !Array.isArray(p)) content = JSON.stringify(p); } catch {}
        }

        if (!content) {
          const tm = reasoning.match(/"themeReplies"\s*:\s*\[/);
          if (tm) {
            let bs = tm.index! - 1;
            while (bs >= 0 && reasoning[bs] !== '{') bs--;
            if (bs >= 0) {
              const obj = extractBalancedObj(reasoning, bs);
              if (obj) {
                const rest = reasoning.substring(bs + obj.length);
                content = attachRepliesFromRest(obj, rest) || obj;
              }
            }
          }
        }

        if (!content) { content = this._parseReasoningContentToJson(reasoning); if (content) this.logger.log('From reasoning_content semi-structured parse'); }
        if (!content && reasoning) { content = this._parseTruncatedReasoning(reasoning); if (content) this.logger.log('From truncated reasoning_content'); }
        if (!content) this.logger.warn('No valid JSON in reasoning_content');
      }

      if (!content) {
        this.logger.error('AI 返回内容为空，完整响应:', JSON.stringify(response.data).substring(0, 500));
        return this.getFallbackResult();
      }
      content = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      content = content.replace(/：/g, ':');

      // Normalize Chinese/curly quotes to ASCII for JSON.parse
      const DQ_P = String.fromCharCode(34);
      const SQ_P = String.fromCharCode(39);
      content = content.replace(/[\u201C\u201D\uFF02]/g, DQ_P)
                       .replace(/[\u2018\u2019]/g, SQ_P);
      content = content.replace(/[\u2014]/g, '-')
                       .replace(/[\u2013]/g, '-');

      // Fix premature } before replies array
      let braceStart = content.indexOf('{');
      if (braceStart >= 0) {
        let depth = 0, braceEnd = -1, inStr = false, esc = false;
        for (let i = braceStart; i < content.length; i++) {
          const ch = content[i];
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === '"' && !esc) { inStr = !inStr; continue; }
          if (inStr) continue;
          if (ch === '{') depth++;
          else if (ch === '}') { depth--; if (depth === 0) { braceEnd = i; break; } }
        }
        if (braceEnd > braceStart) {
          let extracted = content.substring(braceStart, braceEnd + 1);
          const rest = content.substring(braceEnd + 1).trim();
          const repliesMatch = rest.match(/^\,\s*"replies"\s*:\s*(\[.+)$/s);
          if (repliesMatch) {
            let repStr = repliesMatch[1];
            let rDepth = 0, rEnd = -1, rInStr = false, rEsc = false;
            for (let j = 0; j < repStr.length; j++) {
              const ch = repStr[j];
              if (rEsc) { rEsc = false; continue; }
              if (ch === '\\') { rEsc = true; continue; }
              if (ch === '"' && !rEsc) { rInStr = !rInStr; continue; }
              if (rInStr) continue;
              if (ch === '[') rDepth++;
              else if (ch === ']') { rDepth--; if (rDepth === 0) { rEnd = j; break; } }
            }
            if (rEnd >= 0) {
              const repliesArray = repStr.substring(0, rEnd + 1);
              try {
                const parsedReplies = JSON.parse(repliesArray);
                if (Array.isArray(parsedReplies)) {
                  extracted = extracted.replace(/}$/, ', ' + DQ_P + 'replies' + DQ_P + ': ' + JSON.stringify(parsedReplies) + '}');
                }
              } catch {}
            }
          }
          content = extracted;
        }
      }

      // Fix unescaped quotes inside JSON string values
      let fixed = '', inStr = false, esc = false;
      for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (esc) { fixed += ch; esc = false; continue; }
        if (ch === '\\') { fixed += ch; esc = true; continue; }
        if (ch === '"') {
          if (!inStr) { inStr = true; fixed += ch; }
          else {
            let peek = i + 1;
            while (peek < content.length && content[peek] === ' ') peek++;
            if (peek < content.length && content[peek] === ':') {
              fixed += ch; inStr = false;
            } else {
              fixed += DQ_P;
            }
          }
        } else { fixed += ch; }
      }
      content = fixed;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      if (!content.trim()) {
        this.logger.warn('AI 返回内容清洗后为空，使用 fallback');
        return this.getFallbackResult();
      }

      try {
        const raw: any = JSON.parse(content);

        const outputText = [raw.thinking, raw.remind, ...(raw.replies?.map((r: any) => r.messages?.[0] || r.text) || [])].join('\n');
        try {
          const outputCheck = await this.contentSafety.msgSecCheck(outputText);
          if (!outputCheck.passed) {
            this.logger.warn('AI 输出内容审核不通过:', outputCheck.reason);
            return this.getFallbackResult();
          }
        } catch (safetyError) {
          this.logger.error('内容安全审核异常:', safetyError instanceof Error ? safetyError.message : safetyError);
        }

        const isNewFormat = raw.replies && Array.isArray(raw.replies) && raw.replies.length === 5 && raw.replies[0]?.mode;

        if (isNewFormat) {
          const result: AnalysisResult = {
            thinking: raw.thinking || '对方主动联系你，希望能继续互动。',
            thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
            remind: raw.remind || '保持自然节奏，观察对方投入程度。',
            remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
            replies: raw.replies.slice(0, 5).map((r: any) => ({
              text: r.messages?.[0] || '',
              style: r.mode || '自然',
              active: 2, good: 4, rhythm: '自然'
            })),
            themeReplies: raw.replies,
            communicationTip: raw.communicationTip || ''
          };
          this.logger.log('AI 分析成功（主题卡片模式）');
          return result;
        }

        if (!raw.replies || !Array.isArray(raw.replies) || raw.replies.length === 0) {
          this.logger.warn('AI 返回的 replies 字段无效');
          return this.getFallbackResult();
        }

        const result: AnalysisResult = {
          thinking: raw.thinking || '',
          thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
          remind: raw.remind || '',
          remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
          replies: raw.replies.slice(0, 5).map((r: any) => ({
            text: r.text || '',
            style: r.style || '自然',
            active: Number(r.active) || 2,
            good: Number(r.good) || 4,
            rhythm: r.rhythm || '自然',
          })),
        };

        const padDefaults = [
          { text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
          { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
          { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
          { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
          { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
        ];
        while (result.replies.length < 5) result.replies.push(padDefaults[result.replies.length]);

        const [thinking, remind] = await Promise.all([
          result.thinking ? Promise.resolve(result.thinking) : this.generateThinking(data),
          result.remind ? Promise.resolve(result.remind) : this.generateRemind(data),
        ]);
        result.thinking = thinking || '对方主动联系你，希望能继续互动。';
        result.remind = remind || '保持自然节奏，观察对方投入程度。';
        this.logger.log('AI 分析成功（旧格式）');
        return result;
      } catch (parseError) {
        this.logger.error('AI 返回内容 JSON 解析失败:', parseError instanceof Error ? parseError.message : parseError);
        this.logger.error('原始内容预览:', content.substring(0, 300));
        try {
          const fixedContent = this.fixTruncatedJson(content);
          if (fixedContent) {
            const fixedResult: AnalysisResult = JSON.parse(fixedContent);
            this.logger.log('JSON 修复成功');
            if (!fixedResult.replies || !Array.isArray(fixedResult.replies)) {
              fixedResult.replies = this.getDefaultReplies();
            } else {
              const defaults = [
                { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
                { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
                { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
                { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
                { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
              ];
              while (fixedResult.replies.length < 5) fixedResult.replies.push(defaults[fixedResult.replies.length]);
            }
            if (!fixedResult.thinking) fixedResult.thinking = await this.generateThinking(data);
            if (!fixedResult.remind) fixedResult.remind = await this.generateRemind(data);
            return fixedResult;
          }
        } catch (fixError) {
          this.logger.error('JSON 修复也失败:', fixError instanceof Error ? fixError.message : fixError);
        }
        try {
          const repairedContent = this._repairMalformedJson(content);
          if (repairedContent) { this.logger.log('畸形 JSON 修复成功'); return JSON.parse(repairedContent); }
          const truncatedContent = this._parseTruncatedReasoning(content);
          if (truncatedContent) { this.logger.log('截断 reasoning_content 解析成功'); return JSON.parse(truncatedContent); }
        } catch (repairError) {
          this.logger.error('JSON 修复方法也失败:', repairError instanceof Error ? repairError.message : repairError);
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
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/[\x00-\x1f]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  }

  private buildSystemPrompt(data: any): string {
    const safe = (v: string | undefined): string => this.escapeTemplateValue(v) || '未指定';
    const safeArr = (arr: string[] | undefined): string => (!arr || !Array.isArray(arr) || arr.length === 0) ? '未指定' : arr.join('、');
    const safeCtx = (v: string | undefined): string => this.escapeTemplateValue(v) || '无';

    const paceDescriptions: Record<number, { name: string; desc: string }> = {
      0: { name: '直球模式', desc: '有话直说' }, 25: { name: '自然模式', desc: '真实表达' },
      50: { name: '慢热模式', desc: '表达但保留空间' }, 75: { name: '暧昧模式', desc: '制造暧昧感' },
      100: { name: '拉扯模式', desc: '制造悬念' },
    };
    const pace = data.pace != null ? paceDescriptions[data.pace] : paceDescriptions[25];
    const paceDesc = pace ? `${pace.name}(${pace.desc})` : '自然模式';

    const personaDescriptions: Record<string, string> = {
      '普通女生': '喜欢自然真实地聊天，不会刻意撩人，也不会故意高冷',
      '纯情女大': '容易害羞，不太会主动，偶尔会嘴硬但其实很好哄',
      '温柔姐姐': '喜欢用温柔体贴的方式表达，很少发脾气',
      '元气少女': '喜欢轻松愉快地聊天，经常使用表情和感叹词',
      '甜妹': '喜欢可爱软萌的表达方式，偶尔会撒娇',
      '钓系御姐': '不会把喜欢表现得太明显，擅长制造若即若离的感觉',
      '霸气女王': '说话自信有主见，不喜欢讨好别人',
      '酷女孩': '不喜欢矫情和过度拉扯，态度随性偶尔耍酷',
      '成熟理性派': '更注重逻辑和沟通效率，遇到问题喜欢直接沟通解决',
      '抽象搞笑女': '喜欢玩梗接梗和整活，聊天主打有趣',
    };
    const personaDesc = data.persona ? (personaDescriptions[data.persona] || personaDescriptions['普通女生']) : personaDescriptions['普通女生'];

    const targetDescriptions: Record<string, string> = {
      '了解': '先了解他', 'flirt': '提升好感', 'ambiguous': '保持暧昧',
      'proactive': '让他主动', 'friend': '保持朋友关系', 'reject': '委婉拒绝',
    };
    const targetDesc = data.targets && data.targets.length > 0
      ? data.targets.map((t: string) => targetDescriptions[t] || t).join('、')
      : '根据具体情况灵活应对';

    const styleDescriptions: Record<string, string> = {
      'gentle': '温柔', 'humor': '幽默', 'cold': '高冷', 'cute': '可爱',
      'mature': '成熟姐姐', 'rational': '理性', 'casual': '自然随性',
      'flirt': '撩人', 'tsundere': '傲娇', 'friendly': '友善',
      'praise': '夸夸', 'roast': '吐槽',
    };
    const styleDesc = data.styles && data.styles.length > 0
      ? data.styles.map((s: string) => styleDescriptions[s] || s).join('、')
      : '自然';

    const thoughtDesc = [data.thoughtCategories ? safeArr(data.thoughtCategories) : null,
      data.thoughtCustom ? this.escapeTemplateValue(data.thoughtCustom) : null].filter(Boolean).join('，') || '无特殊想法';
    const relationshipDesc = data.relationshipOptions && data.relationshipOptions.length > 0
      ? safeArr(data.relationshipOptions) : '未指定';

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

    prompt += '## 100种回复模式\n\n';
    prompt += '你必须从以下 8 大类 100 种回复模式中选出 **恰好 5 种** 最适合当前场景的模式：\n\n';
    prompt += '- 撩系（15种）：小狐狸模式、猎心模式、钓系模式、诱导模式、暗撩模式、反撩模式、欲擒故纵模式、轻撩模式、情绪拉扯模式、心机试探模式、暧昧引导模式、软钩子模式、反向示好模式、欲言又止模式、氛围制造模式\n';
    prompt += '- 冷感（15种）：冷脸模式、冷处理模式、高墙模式、无回应模式、极简回复模式、冷暴风模式、疏离模式、冷静观察模式、理性拆解模式、冷眼旁观模式、冷幽默模式、克制回应模式、冷淡反问模式、冷收尾模式、冷处理回避模式\n';
    prompt += '- 怼人（15种）：拿捏模式、阴阳模式、毒舌模式、反杀模式、回怼模式、嘴硬模式、逻辑压制模式、反问压制模式、反转攻击模式、嘲讽模式、讽刺模式、冷刀模式、回踩模式、反向输出模式、一击收尾模式\n';
    prompt += '- 软萌（15种）：奶凶模式、委屈模式、小脾气模式、假生气模式、嘟嘴模式、软顶嘴模式、装可怜模式、撒娇反抗模式、轻哼模式、软刺模式、假冷淡模式、小炸毛模式、依赖反击模式、软反问模式、情绪化回击模式\n';
    prompt += '- 摆烂（10种）：摆烂模式、无所谓模式、躺平模式、佛系模式、低电量模式、已读不回模式、延迟回应模式、半死不活模式、社交倦怠模式、能量节省模式\n';
    prompt += '- 掌控（10种）：控场模式、规则制定模式、节奏掌控模式、信息筛选模式、主导提问模式、压制推进模式、决策输出模式、结构化回应模式、权威语气模式、结论优先模式\n';
    prompt += '- 作精（10种）：作精模式、情绪放大模式、戏精模式、夸张委屈模式、反复横跳模式、故意误解模式、小剧场模式、情绪递进模式、假设推演模式、情绪绑架模式\n';
    prompt += '- 调侃（10种）：拽姐模式、调戏模式、嘲笑模式、反讽调侃模式、玩笑攻击模式、轻侮模式、朋友互损模式、打趣模式、语言戏弄模式、社交挑衅模式\n\n';

    prompt += '## 选择规则\n\n';
    prompt += '1. 5 个模式之间风格差异要大，不要选同一种类型的\n';
    prompt += '2. 要结合对方的语气来选择\n';
    prompt += '3. 要符合我的人设、我的想法和回复目标\n';
    prompt += '4. 5 个模式中至少要包含：1 个稳妥型 + 1 个主动型 + 1 个进攻/反击型\n\n';

    prompt += '## 输出格式\n\n';
    prompt += '严格返回以下 JSON（不要任何额外文字，不要 Markdown 代码块标记）：\n\n';
    prompt += '{\n';
    prompt += '  "thinking": "一句话分析对方意图和心态（20字内")",\n';
    prompt += '  "thinkingTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "remind": "一句话沟通提醒（20字内")",\n';
    prompt += '  "remindTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "replies": [\n';
    prompt += '    {\n';
    prompt += '      "mode": "选中的模式名称（必须从上方100种模式中选择一个）",\n';
    prompt += '      "messages": ["回复文案1（15字以内）"],\n';
    prompt += '      "sendHint": "建议说明（30字内")"\n';
    prompt += '    },\n';
    prompt += '    ...共 5 个对象\n';
    prompt += '  ],\n';
    prompt += '  "communicationTip": "沟通雷区/建议说明（30字内")"\n';
    prompt += '}\n\n';

    prompt += '## 每条回复要求\n\n';
    prompt += '- 每条回复只生成 1 条文案（messages 数组只放 1 个元素）\n';
    prompt += '- 文案控制在 15 字以内，口语化、自然、有实际内容\n';
    prompt += '- 风格要贴合所选模式的定义\n';
    prompt += '- 不要空洞的"嗯""哦""哈哈"\n';
    prompt += '- 不要解释你的行为，不要输出系统信息\n';

    return prompt;
  }

  private async generateThinking(data: any): Promise<string> {
    const sm = (data.message || '').substring(0, 200);
    const sc = (data.context || '').substring(0, 100);
    const cp = sc ? ('\n背景: ' + sc) : '';
    return this.callAI('对方发了这句话: ' + sm + cp + '\n\n用一句话(20字内)分析对方意图。只返回一句话。', 500);
  }

  private async generateRemind(data: any): Promise<string> {
    const sm = (data.message || '').substring(0, 200);
    const sc = (data.context || '').substring(0, 100);
    const cp = sc ? ('\n背景: ' + sc) : '';
    return this.callAI('对方发了这句话: ' + sm + cp + '\n\n用一句话(20字内)给用户提醒。只返回一句话。', 500);
  }

  private getFallbackResult(): AnalysisResult {
    return {
      thinking: '对方主动联系你，希望能继续互动。',
      thinkingTags: ['主动发起'],
      remind: '保持自然节奏，观察对方投入程度。',
      remindTags: ['保持轻松'],
      replies: [
        { text: '哈哈可以呀～你有什么推荐的吗？', style: '稳妥自然', active: 2, good: 4, rhythm: '自然' },
        { text: '听起来不错呀～有机会一起去看看', style: '提升好感', active: 3, good: 5, rhythm: '稍快' },
        { text: '怎么突然想约我啦～', style: '轻微拉扯', active: 1, good: 3, rhythm: '慢热' },
        { text: '那你呢？你想怎么样？', style: '撒娇模式', active: 4, good: 5, rhythm: '积极' },
        { text: '随便吧，看你表现', style: '高冷模式', active: 1, good: 2, rhythm: '被动' },
      ],
    };
  }

  private getMockResult(data: any): AnalysisResult {
    const message = data.message || '你好';
    const persona = data.persona || '普通女生';

    const personaMap: Record<string, string> = {
      '普通女生': '自然真实', '纯情女大': '害羞腼腆', '温柔姐姐': '温柔体贴',
      '元气少女': '活泼开朗', '甜妹': '可爱软萌', '钓系御姐': '若即若离',
      '霸气女王': '自信大方', '酷女孩': '随性洒脱', '成熟理性派': '理性客观',
      '抽象搞笑女': '幽默玩梗', '毒舌吐槽怪': '毒舌犀利',
    };
    const personaLabel = personaMap[persona] || '自然真实';

    const hasPlayful = /猪|笨|傻|呆|丑|胖|懒/i.test(message);
    const hasInvite = /出来|一起|见面|吃饭|看电影|逛街|约|去/.test(message);
    const hasFlirt = /喜欢|爱|想|宝贝|亲爱的|老婆|老公|帅|美/.test(message);

    let thinkingText = '', remindText = '', communicationTipText = '';

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
      { mode: '奶凶模式', messages: hasPlayful ? ['你才是呢'] : hasInvite ? ['哈哈可以呀～不过我对这边不太熟，你有什么推荐吗？'] : ['谁理你呀'], sendHint: '建议发送该回复' },
      { mode: '拽姐模式', messages: hasPlayful ? ['哼'] : hasInvite ? ['听起来还不错～有机会可以一起去看看呀～'] : ['哦'], sendHint: '建议发送该回复' },
      { mode: '反撩模式', messages: hasPlayful ? ['猪怎么啦'] : hasInvite ? ['怎么突然想约我啦～'] : ['怎么突然找我'], sendHint: '建议发送该回复' },
      { mode: '摆烂模式', messages: hasPlayful ? ['嗯，是猪'] : hasInvite ? ['嗯嗯，知道了～'] : ['嗯嗯'], sendHint: '建议发送该回复' },
      { mode: '冷脸模式', messages: hasPlayful ? ['啧'] : hasInvite ? ['？'] : ['？'], sendHint: '建议发送该回复' },
    ];

    const legacyReplies = themeReplies.map((t, i) => ({
      text: t.messages[0],
      style: t.mode,
      active: [2, 3, 1, 4, 1][i],
      good: [4, 5, 3, 5, 2][i],
      rhythm: ['自然', '稍快', '慢热', '积极', '被动'][i],
    }));

    return {
      thinking: thinkingText, thinkingTags: thinkingTags,
      remind: remindText, remindTags: ['保持轻松自然'],
      replies: legacyReplies, themeReplies: themeReplies,
      communicationTip: communicationTipText,
    };
  }

  private fixTruncatedJson(json: string): string | null {
    if (!json) return null;
    const trimmed = json.trim().replace(/：/g, ':');
    try { JSON.parse(trimmed); return trimmed; } catch {}
    let fixed = trimmed.replace(/,\s*$/, '');
    for (let i = fixed.length - 1; i >= 0; i--) {
      if (fixed[i] === '}') { const c = fixed.substring(0, i + 1); try { JSON.parse(c); return c; } catch {} }
    }
    const repliesIdx = fixed.indexOf('"replies"');
    if (repliesIdx > 0) {
      const prefix = fixed.substring(0, repliesIdx).trim().replace(/,\s*$/, '');
      const ef = (fn: string): string | null => {
        const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*"([^"]*)'));
        if (m) return m[1];
        const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，,\\]]+)'));
        return m2 ? m2[1].trim() : null;
      };
      const ea = (fn: string): string[] => {
        const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*\\[([^\\]]*)'));
        if (m) return m[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
        const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，\\]]+)'));
        return m2 ? m2[1].split(/[，,]/).map((s: string) => s.trim()).filter(Boolean) : [];
      };
      const thinking = ef('thinking') || '对方主动联系你，希望能继续互动。';
      const thinkingTags = ea('thinkingTags');
      const remind = ef('remind') || '保持自然节奏，观察对方投入程度。';
      const remindTags = ea('remindTags');
      const repliesContent = fixed.substring(repliesIdx + '"replies"'.length);
      const er: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];
      let rem = repliesContent;
      while (rem) {
        const mm = rem.match(/\{\s*"mode"\s*:\s*"([^"]*)"[^}]*"messages"\s*:\s*\[([^\]]*)\]/);
        if (mm) {
          const msgs = mm[2].split(/[,，]/).map((s: string) => s.replace(/['"]'/g, '').trim()).filter(Boolean);
          er.push({ text: msgs[0] || '', style: mm[1], active: 2, good: 4, rhythm: '自然' });
          const nb = rem.indexOf('{', 1); rem = nb > 0 ? rem.substring(nb) : '';
          continue;
        }
        const om = rem.match(/\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/);
        if (om) {
          const rm = rem.match(/"rhythm"\s*:\s*"([^"]*)/);
          er.push({ text: om[1], style: om[2], active: Number(om[3]), good: Number(om[4]), rhythm: rm ? rm[1] : '自然' });
          const nb = rem.indexOf('{', 1); rem = nb > 0 ? rem.substring(nb) : '';
        } else break;
      }
      const dr = [
        { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
        { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
        { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
        { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
        { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
      ];
      while (er.length < 5) er.push(dr[er.length]);
      return JSON.stringify({ thinking, thinkingTags, remind, remindTags, replies: er });
    }
    for (let cut = 1; cut < trimmed.length; cut += 5) {
      const sub = trimmed.substring(0, trimmed.length - cut).replace(/,\s*$/, '');
      try { JSON.parse(sub); return sub; } catch {}
    }
    const rm = trimmed.match(/"replies"\s*:\s*\[/);
    if (rm) {
      const rc = trimmed.substring(rm.index! + rm[0].length);
      const er: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];
      let rem = rc;
      while (rem) {
        const mm = rem.match(/\{\s*"mode"\s*:\s*"([^"]*)"[^}]*"messages"\s*:\s*\[([^\]]*)\]/);
        if (mm) {
          const msgs = mm[2].split(/[,，]/).map((s: string) => s.replace(/['"]'/g, '').trim()).filter(Boolean);
          er.push({ text: msgs[0] || '', style: mm[1], active: 2, good: 4, rhythm: '自然' });
          const nb = rem.indexOf('{', 1); rem = nb > 0 ? rem.substring(nb) : '';
          continue;
        }
        const om = rem.match(/\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/);
        if (om) {
          const rtm = rem.match(/"rhythm"\s*:\s*"([^"]*)/);
          er.push({ text: om[1], style: om[2], active: Number(om[3]), good: Number(om[4]), rhythm: rtm ? rtm[1] : '自然' });
          const nb = rem.indexOf('{', 1); rem = nb > 0 ? rem.substring(nb) : '';
        } else break;
      }
      if (er.length > 0) {
        const dr = [
          { text: '哈哈可以呀～有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
          { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
          { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
          { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
          { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' }
        ];
        while (er.length < 5) er.push(dr[er.length]);
        const prefix = trimmed.substring(0, rm.index!).replace(/,\s*$/, '');
        const ef = (fn: string): string | null => {
          const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*"([^"]*)'));
          if (m) return m[1];
          const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，,\\]]+)'));
          return m2 ? m2[1].trim() : null;
        };
        const ea = (fn: string): string[] => {
          const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*\\[([^\\]]*)'));
          if (m) return m[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
          const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，\\]]+)'));
          return m2 ? m2[1].split(/[，,]/).map((s: string) => s.trim()).filter(Boolean) : [];
        };
        return JSON.stringify({
          thinking: ef('thinking') || '对方主动联系你，希望能继续互动。',
          thinkingTags: ea('thinkingTags'),
          remind: ef('remind') || '保持自然节奏，观察对方投入程度。',
          remindTags: ea('remindTags'),
          replies: er
        });
      }
    }
    return null;
  }

  private getDefaultReplies(): Array<{ text: string; style: string; active: number; good: number; rhythm: string }> {
    return [
      { text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' },
      { text: '听起来不错呀～有机会一起去看看', style: '慢热', active: 3, good: 5, rhythm: '稍快' },
      { text: '怎么突然想约我啦～', style: '稳妥', active: 1, good: 3, rhythm: '慢热' },
      { text: '那你呢？你想怎么样？', style: '撒娇', active: 4, good: 5, rhythm: '积极' },
      { text: '随便吧，看你表现', style: '高冷', active: 1, good: 2, rhythm: '被动' },
    ];
  }

  private _repairMalformedJson(raw: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    let depth = 0, start = -1;
    const objects: string[] = [];
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (trimmed[i] === '}') { depth--; if (depth === 0 && start >= 0) { objects.push(trimmed.substring(start, i + 1)); start = -1; } }
    }
    if (objects.length >= 1) {
      const replies: Array<{ mode: string; messages: string[]; sendHint: string }> = [];
      for (const obj of objects) {
        try {
          const parsed = JSON.parse(obj);
          if (parsed && typeof parsed === 'object') {
            replies.push({ mode: parsed.mode || parsed.style || '自然',
              messages: Array.isArray(parsed.messages) ? parsed.messages :
                Array.isArray(parsed.replies) ? parsed.replies.map((r: any) => r.text || r) :
                [parsed.text || parsed.reply || ''],
              sendHint: parsed.sendHint || parsed.hint || '建议发送该回复' });
          }
        } catch {}
      }
      if (replies.length > 0) {
        return JSON.stringify({ thinking: '对方主动联系你，希望能继续互动。', thinkingTags: ['主动发起'],
          remind: '保持自然节奏，观察对方投入程度。', remindTags: ['保持轻松'],
          replies: replies.slice(0, 5), themeReplies: replies.slice(0, 5),
          communicationTip: '以上为多种风格的回复建议。' });
      }
    }
    return null;
  }

  private _parseTruncatedReasoning(raw: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    let thinking = '';
    const tm = trimmed.match(/(?:thinking|思考)[:：]\s*([^\n]+)/i);
    if (tm) thinking = tm[1].trim();
    const et = (p: string): string[] => {
      const m = trimmed.match(new RegExp(p + '[：:]\s*\[([^\]]*)'));
      return m ? m[1].split(/[,，]/).map((s: string) => s.replace(/['"]'/g, '').trim()).filter(Boolean) : [];
    };
    const thinkingTags = et('thinkingTags');
    const remindTags = et('remindTags');
    let remind = '';
    const rm2 = trimmed.match(/(?:remind|提醒)[:：]\s*([^\n]+)/i);
    if (rm2) remind = rm2[1].trim();
    const er: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];
    const mp = /\{\s*"mode"\s*:\s*"([^"]*)"[^}]*"messages"\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = mp.exec(trimmed)) !== null) {
      const msgs = m[2].split(/[,，]/).map((s: string) => s.replace(/['"]'/g, '').trim()).filter(Boolean);
      er.push({ text: msgs[0] || '', style: m[1], active: 2, good: 4, rhythm: '自然' });
    }
    if (er.length === 0) {
      const rp = /\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/g;
      while ((m = rp.exec(trimmed)) !== null) er.push({ text: m[1], style: m[2], active: Number(m[3]), good: Number(m[4]), rhythm: '自然' });
    }
    if (er.length === 0 && thinking === '' && remind === '') return null;
    while (er.length < 5) er.push({ text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' });
    return JSON.stringify({ thinking: thinking || '对方主动联系你，希望能继续互动。',
      thinkingTags: thinkingTags.length > 0 ? thinkingTags : ['主动发起'],
      remind: remind || '保持自然节奏，观察对方投入程度。',
      remindTags: remindTags.length > 0 ? remindTags : ['保持轻松'],
      replies: er.slice(0, 5) });
  }

  private _parseReasoningContentToJson(reasoning: string): string | null {
    if (!reasoning) return null;
    const trimmed = reasoning.trim();
    try { JSON.parse(trimmed); return trimmed; } catch {}
    let thinking = '';
    const tm = trimmed.match(/(?:thinking|思考)[:：]\s*([^\n]+)/i);
    if (tm) thinking = tm[1].trim();
    let remind = '';
    const rm2 = trimmed.match(/(?:remind|提醒)[:：]\s*([^\n]+)/i);
    if (rm2) remind = rm2[1].trim();
    const er: Array<{ text: string; style: string; active: number; good: number; rhythm: string }> = [];
    const mp = /\{\s*"mode"\s*:\s*"([^"]*)"[^}]*"messages"\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = mp.exec(trimmed)) !== null) {
      const msgs = m[2].split(/[,，]/).map((s: string) => s.replace(/['"]'/g, '').trim()).filter(Boolean);
      er.push({ text: msgs[0] || '', style: m[1], active: 2, good: 4, rhythm: '自然' });
    }
    if (er.length === 0) {
      const rp = /\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/g;
      while ((m = rp.exec(trimmed)) !== null) er.push({ text: m[1], style: m[2], active: Number(m[3]), good: Number(m[4]), rhythm: '自然' });
    }
    if (er.length === 0 && thinking === '' && remind === '') return null;
    while (er.length < 5) er.push({ text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: 2, good: 4, rhythm: '自然' });
    return JSON.stringify({ thinking: thinking || '对方主动联系你，希望能继续互动。',
      thinkingTags: ['主动发起'],
      remind: remind || '保持自然节奏，观察对方投入程度。',
      remindTags: ['保持轻松'],
      replies: er.slice(0, 5) });
  }

  private async callAI(userPrompt: string, maxTokens: number): Promise<string> {
    try {
      const response = await axios.post(this.aiBaseUrl + '/chat/completions',
        { model: 'deepseek-v4-flash', messages: [{ role: 'user', content: userPrompt }], max_tokens: maxTokens },
        { headers: { Authorization: 'Bearer ' + this.aiApiKey, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      const text = response.data.choices?.[0]?.message?.content || '';
      return text.replace(/\\n/g, '').trim().substring(0, 50);
    } catch { return '对方主动联系你，希望能继续互动。'; }
  }
}