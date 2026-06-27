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

// Persona-to-category mapping: which categories each persona should prefer
const PERSONA_CATEGORY_MAP: Record<string, string[]> = {
  '普通女生': ['撩系', '冷感', '软萌', '摆烂', '掌控', '调侃'],
  '纯情女大': ['软萌', '冷感', '摆烂', '怼人', '撩系'],
  '温柔姐姐': ['软萌', '撩系', '摆烂', '掌控', '冷感'],
  '元气少女': ['软萌', '撩系', '调侃', '怼人', '摆烂'],
  '甜妹': ['软萌', '撩系', '摆烂', '冷感', '怼人'],
  '钓系御姐': ['撩系', '掌控', '冷感', '调侃', '摆烂'],
  '霸气女王': ['掌控', '冷感', '调侃', '怼人', '撩系'],
  '酷女孩': ['冷感', '掌控', '摆烂', '调侃', '怼人'],
  '成熟理性派': ['掌控', '冷感', '摆烂', '怼人', '撩系'],
  '抽象搞笑女': ['调侃', '怼人', '软萌', '撩系', '摆烂'],
};

// Mode pool by category for dynamic filtering
const CATEGORY_MODES: Record<string, string[]> = {
  '撩系': ['小狐狸模式', '猎心模式', '钓系模式', '诱导模式', '暗撩模式', '反撩模式', '欲擒故纵模式', '轻撩模式', '情绪拉扯模式', '心机试探模式', '暧昧引导模式', '软钩子模式', '反向示好模式', '欲言又止模式', '氛围制造模式'],
  '冷感': ['冷脸模式', '冷处理模式', '高墙模式', '无回应模式', '极简回复模式', '冷暴风模式', '疏离模式', '冷静观察模式', '理性拆解模式', '冷眼旁观模式', '冷幽默模式', '克制回应模式', '冷淡反问模式', '冷收尾模式', '冷处理回避模式'],
  '怼人': ['拿捏模式', '阴阳模式', '毒舌模式', '反杀模式', '回怼模式', '嘴硬模式', '逻辑压制模式', '反问压制模式', '反转攻击模式', '嘲讽模式', '讽刺模式', '冷刀模式', '回踩模式', '反向输出模式', '一击收尾模式'],
  '软萌': ['奶凶模式', '委屈模式', '小脾气模式', '假生气模式', '嘟嘴模式', '软顶嘴模式', '装可怜模式', '撒娇反抗模式', '轻哼模式', '软刺模式', '假冷淡模式', '小炸毛模式', '依赖反击模式', '软反问模式', '情绪化回击模式'],
  '摆烂': ['摆烂模式', '无所谓模式', '躺平模式', '佛系模式', '低电量模式', '已读不回模式', '延迟回应模式', '半死不活模式', '社交倦怠模式', '能量节省模式'],
  '掌控': ['控场模式', '规则制定模式', '节奏掌控模式', '信息筛选模式', '主导提问模式', '压制推进模式', '决策输出模式', '结构化回应模式', '权威语气模式', '结论优先模式'],
  '作精': ['作精模式', '情绪放大模式', '戏精模式', '夸张委屈模式', '反复横跳模式', '故意误解模式', '小剧场模式', '情绪递进模式', '假设推演模式', '情绪绑架模式'],
  '调侃': ['拽姐模式', '调戏模式', '嘲笑模式', '反讽调侃模式', '玩笑攻击模式', '轻侮模式', '朋友互损模式', '打趣模式', '语言戏弄模式', '社交挑衅模式'],
};

// Mode definitions: one-liner explaining what each mode means
const MODE_DEFINITIONS: Record<string, string> = {
  '小狐狸模式': '俏皮撩人，用可爱的话术让对方心动',
  '猎心模式': '精准抓住对方心理弱点，一击命中',
  '钓系模式': '像钓鱼一样慢慢引诱，让对方上钩',
  '诱导模式': '引导对方说出更多，掌握信息优势',
  '暗撩模式': '表面正经，暗地里撩拨',
  '反撩模式': '对方撩你，你反过来撩回去',
  '欲擒故纵模式': '先热情后冷淡，让对方患得患失',
  '轻撩模式': '轻微撩拨，点到为止',
  '情绪拉扯模式': '在热情和冷淡之间切换，制造情绪波动',
  '心机试探模式': '用小心机试探对方底线',
  '暧昧引导模式': '引导关系往暧昧方向发展',
  '软钩子模式': '用温柔的话术套出对方真心',
  '反向示好模式': '表面示好实则试探',
  '欲言又止模式': '话说一半，让对方好奇追问',
  '氛围制造模式': '营造暧昧或浪漫的氛围',
  '冷脸模式': '面无表情，让对方摸不透',
  '冷处理模式': '不正面回应，让对方自己消化',
  '高墙模式': '筑起防线，不让对方靠近',
  '无回应模式': '完全不回应，让对方着急',
  '极简回复模式': '用最少的字回复',
  '冷暴风模式': '冰冷强势，让对方知难而退',
  '疏离模式': '保持距离感，不热络',
  '冷静观察模式': '安静观察对方反应',
  '理性拆解模式': '理性分析对方意图',
  '冷眼旁观模式': '旁观者角度，不参与',
  '冷幽默模式': '用冷淡的语气讲冷笑话',
  '克制回应模式': '克制情感，适度回应',
  '冷淡反问模式': '用冷淡的语气反问',
  '冷收尾模式': '用冷淡的话结束对话',
  '冷处理回避模式': '用冷淡方式回避话题',
  '拿捏模式': '精准拿捏对方软肋',
  '阴阳模式': '阴阳怪气，让对方不舒服',
  '毒舌模式': '言辞犀利，直击要害',
  '反杀模式': '对方攻击你，你反过来碾压',
  '回怼模式': '直接回击对方的话',
  '嘴硬模式': '嘴上不认输，心里可能有数',
  '逻辑压制模式': '用逻辑碾压对方',
  '反问压制模式': '用连环反问压制对方',
  '反转攻击模式': '先示弱后反击',
  '嘲讽模式': '嘲讽对方',
  '讽刺模式': '用讽刺的方式表达不满',
  '冷刀模式': '温柔外表下藏着一刀',
  '回踩模式': '对方踩你，你踩回去',
  '反向输出模式': '把对方的逻辑反过来用',
  '一击收尾模式': '一句话终结话题',
  '奶凶模式': '假装生气，其实很可爱',
  '委屈模式': '装委屈让对方心疼',
  '小脾气模式': '撒点小娇撒点小脾气',
  '假生气模式': '假装生气逗对方',
  '嘟嘴模式': '嘟嘴卖萌',
  '软顶嘴模式': '软绵绵地反驳',
  '装可怜模式': '装可怜博同情',
  '撒娇反抗模式': '边撒娇边反抗',
  '轻哼模式': '轻轻哼一声表示不满',
  '软刺模式': '温柔中带点刺',
  '假冷淡模式': '假装冷淡其实在意',
  '小炸毛模式': '小范围炸毛，可爱为主',
  '依赖反击模式': '先依赖后反击',
  '软反问模式': '软绵绵地反问',
  '情绪化回击模式': '带着情绪回击',
  '摆烂模式': '无所谓，随便吧',
  '无所谓模式': '真的无所谓',
  '躺平模式': '放弃抵抗，接受现实',
  '佛系模式': '随缘，不强求',
  '低电量模式': '像手机没电一样懒得说话',
  '已读不回模式': '看了但不回',
  '延迟回应模式': '过很久才回复',
  '半死不活模式': '半死不活的回复状态',
  '社交倦怠模式': '不想社交',
  '能量节省模式': '省电模式回复',
  '控场模式': '掌控对话走向',
  '规则制定模式': '制定聊天规则',
  '节奏掌控模式': '控制对话节奏',
  '信息筛选模式': '主动筛选对方信息',
  '主导提问模式': '主导提问方向',
  '压制推进模式': '强势推进话题',
  '决策输出模式': '直接给出结论',
  '结构化回应模式': '有条理地回应',
  '权威语气模式': '用权威的语气说话',
  '结论优先模式': '先说结论再说理由',
  '作精模式': '故意作一下',
  '情绪放大模式': '把情绪放大',
  '戏精模式': '内心戏很多',
  '夸张委屈模式': '夸张地表达委屈',
  '反复横跳模式': '态度反复变化',
  '故意误解模式': '故意曲解对方意思',
  '小剧场模式': '脑补一出大戏',
  '情绪递进模式': '情绪层层加码',
  '假设推演模式': '假设各种情况推演',
  '情绪绑架模式': '用情绪绑架对方',
  '拽姐模式': '拽拽的，不在乎',
  '调戏模式': '主动调戏对方',
  '嘲笑模式': '嘲笑对方',
  '反讽调侃模式': '用反讽的方式调侃',
  '玩笑攻击模式': '以玩笑为名攻击',
  '轻侮模式': '轻微的侮辱式调侃',
  '朋友互损模式': '像朋友一样互损',
  '打趣模式': '打趣对方',
  '语言戏弄模式': '用语言戏弄对方',
  '社交挑衅模式': '社交场合的挑衅',
};


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
        { model: 'deepseek-v4-flash', temperature: 0.3,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: data.message }],
          max_tokens: 4096,
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
      content = content.replace(/[�]/g, ':');

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
        this.logger.log('JSON content preview: ' + content.substring(0, 500));
        let raw: any = JSON.parse(content);
        // Deduplicate replies by text to prevent duplicate cards
        if (raw.replies && Array.isArray(raw.replies)) {
          const seenAll = new Set<string>();
          const dedupedAll: any[] = [];
          for (const r of raw.replies) {
            const key = r.text || r.messages?.[0] || '';
            if (!seenAll.has(key)) { seenAll.add(key); dedupedAll.push(r); }
          }
          if (dedupedAll.length > 0) raw.replies = dedupedAll;
        }


        // Auto-retry if AI returned wrong number of replies (must be exactly 5)
        const replyCount = raw.replies && Array.isArray(raw.replies) ? raw.replies.length : 0;
        if (replyCount !== 5) {
          this.logger.warn('AI returned ' + replyCount + ' replies, expected 5. Retrying...');
          const retryResponse = await axios.post(
            this.aiBaseUrl + '/chat/completions',
            { model: 'deepseek-v4-flash', temperature: 0.3,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: data.message + '\n\n【重要提醒】你上一次回复的 replies 数组数量不正确（' + replyCount + ' 条，应为 5 条）。请重新生成，确保恰好 5 条不同的回复。' }
              ],
              max_tokens: 4096,
            },
            { headers: { Authorization: 'Bearer ' + this.aiApiKey, 'Content-Type': 'application/json' }, timeout: 90000 },
          );
          const retryContent = retryResponse.data.choices?.[0]?.message?.content || '';
          const retryReasoning = retryResponse.data.choices?.[0]?.message?.reasoning_content || '';
          let retryJson = retryContent || '';
          if (!retryJson && retryReasoning) {
            const DQ_N = String.fromCharCode(34);
            const SQ_N = String.fromCharCode(39);
            const cleanReasoning = retryReasoning.replace(/[\u201C\u201D\uFF02]/g, DQ_N).replace(/[\u2018\u2019]/g, SQ_N);
            for (let i = 0; i < cleanReasoning.length; i++) {
              if (cleanReasoning[i] === '{') {
                let depth = 0;
                for (let j = i; j < cleanReasoning.length; j++) {
                  if (cleanReasoning[j] === '{') depth++;
                  else if (cleanReasoning[j] === '}') { depth--; if (depth === 0) { retryJson = cleanReasoning.substring(i, j + 1); break; } }
                }
                if (retryJson) break;
              }
            }
          }
          if (retryJson) {
            try {
              const retryRaw = JSON.parse(retryJson);
              const retryCount = retryRaw.replies && Array.isArray(retryRaw.replies) ? retryRaw.replies.length : 0;
              if (retryCount > 0) {
                this.logger.log('Retry succeeded: got ' + retryCount + ' replies');
                raw = retryRaw;
                content = retryJson;
              } else {
                this.logger.warn('Retry also returned 0 replies, falling back');
              }
            } catch (retryParseError) {
              this.logger.error('Retry JSON parse failed: ' + (retryParseError instanceof Error ? retryParseError.message : retryParseError));
            }
          }
        }

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

        const isNewFormat = raw.replies && Array.isArray(raw.replies) && raw.replies.length > 0 && (raw.replies[0]?.mode || raw.replies[0]?.messages);

        if (isNewFormat) {
          // Deduplicate replies by text to prevent duplicate cards
          const seenText = new Set<string>();
          const deduped: typeof raw.replies = [];
          for (const r of raw.replies) {
            const key = r.messages?.[0] || '';
            if (!seenText.has(key)) { seenText.add(key); deduped.push(r); }
          }
          if (deduped.length > 0) raw.replies = deduped;
          if (raw.replies.length === 0) raw.replies = [];

          const result: AnalysisResult = {
            thinking: raw.thinking || '对方主动联系你，希望能继续互动。',
            thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
            remind: raw.remind || '保持自然节奏，观察对方投入程度。',
            remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
            replies: raw.replies.slice(0, 5).map((r: any, idx: number) => ({
              text: r.messages?.[0] || '',
              style: r.mode || '自然',
              active: Number(r.active) || [2, 3, 1, 4, 1][idx % 5],
              good: Number(r.good) || [4, 5, 3, 5, 2][idx % 5],
              rhythm: r.rhythm || ['自然', '稍快', '慢热', '积极', '被动'][idx % 5]
            })),
            themeReplies: raw.replies,
            communicationTip: raw.communicationTip || ''
          };
          this.logger.log('AI 分析成功（主题卡片模式）');
          return result;
        }

        // --- Old format path: AI returned text/style/active/good/rhythm ---
        // But also handle cases where AI returned mixed format (has mode but not enough for new format check)
        if (raw.replies && Array.isArray(raw.replies) && raw.replies.length > 0) {
          // Check if this is actually new format with fewer than 5 items
          if (raw.replies[0]?.mode && !raw.replies[0]?.text) {
            this.logger.log('Detected new format with fewer items, converting to old format');
            const result: AnalysisResult = {
              thinking: raw.thinking || '对方主动联系你，希望能继续互动。',
              thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
              remind: raw.remind || '保持自然节奏，观察对方投入程度。',
              remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
              replies: raw.replies.slice(0, 5).map((r: any, idx: number) => ({
                text: r.messages?.[0] || '',
                style: r.mode || '自然',
                active: Number(r.active) || [2, 3, 1, 4, 1][idx % 5],
                good: Number(r.good) || [4, 5, 3, 5, 2][idx % 5],
                rhythm: r.rhythm || ['自然', '稍快', '慢热', '积极', '被动'][idx % 5]
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
            this.logger.log('AI 分析成功（旧格式-新数据转换）');
            return result;
          }
          // AI returned old format (text/style/active/good/rhythm) — convert to new format
          if (raw.replies[0]?.text && !raw.replies[0]?.mode && !raw.replies[0]?.messages) {
            this.logger.log('Detected old format, converting to new format');
            const oldReplies = raw.replies.map((r: any) => ({
              mode: r.style || '自然',
              messages: [r.text || ''],
              sendHint: ''
            }));
            raw.replies = oldReplies;
            const isNewFormat2 = raw.replies && Array.isArray(raw.replies) && raw.replies.length > 0 && (raw.replies[0]?.mode || raw.replies[0]?.messages);
            if (isNewFormat2) {
              const seenText = new Set<string>();
              const deduped: typeof raw.replies = [];
              for (const r of raw.replies) {
                const key = r.messages?.[0] || '';
                if (!seenText.has(key)) { seenText.add(key); deduped.push(r); }
              }
              if (deduped.length > 0) raw.replies = deduped;
              const result: AnalysisResult = {
                thinking: raw.thinking || '对方主动联系你，希望能继续互动。',
                thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
                remind: raw.remind || '保持自然节奏，观察对方投入程度。',
                remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
                replies: raw.replies.slice(0, 5).map((r: any, idx: number) => ({
                  text: r.messages?.[0] || '',
                  style: r.mode || '自然',
                  active: Number(r.active) || [2, 3, 1, 4, 1][idx % 5],
                  good: Number(r.good) || [4, 5, 3, 5, 2][idx % 5],
                  rhythm: r.rhythm || ['自然', '稍快', '慢热', '积极', '被动'][idx % 5]
                })),
                themeReplies: raw.replies,
                communicationTip: raw.communicationTip || ''
              };
              this.logger.log('AI 分析成功（旧格式转新格式）');
              return result;
            }
          }
        }

        if (!raw.replies || !Array.isArray(raw.replies) || raw.replies.length === 0) {
          // Try to recover replies from the original content before giving up
          this.logger.log('AI replies empty, attempting recovery from content');
          const recovered = this.fixTruncatedJson(content);
          if (recovered) {
            try {
              const recoveredRaw: any = JSON.parse(recovered);
              if (recoveredRaw.replies && Array.isArray(recoveredRaw.replies) && recoveredRaw.replies.length > 0) {
                raw = recoveredRaw;
                this.logger.log('Reply recovery from fixTruncatedJson succeeded');
              }
            } catch {}
          }
          this.logger.warn('AI replies invalid, retrying from message.content');
          const mc = response.data.choices?.[0]?.message?.content || '';
          if (mc) {
            let fc = mc.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
            fc = fc.replace(/[�]/g, ':');
            const DQ_R = String.fromCharCode(34);
            const SQ_R = String.fromCharCode(39);
            fc = fc.replace(/[\u201C\u201D\uFF02]/g, DQ_R)
                   .replace(/[\u2018\u2019]/g, SQ_R);
            let fx = '', ins = false, ex = false;
            for (let i = 0; i < fc.length; i++) {
              const ch = fc[i];
              if (ex) { fx += ch; ex = false; continue; }
              if (ch === '\\') { fx += ch; ex = true; continue; }
              if (ch === '"') {
                if (!ins) { ins = true; fx += ch; }
                else {
                  let pk = i + 1;
                  while (pk < fc.length && fc[pk] === ' ') pk++;
                  if (pk < fc.length && fc[pk] === ':') { fx += ch; ins = false; }
                  else { fx += DQ_R; }
                }
              } else { fx += ch; }
            }
            fc = fx;
            const bs2 = fc.indexOf('{');
            if (bs2 >= 0) {
              let dp = 0, be2 = -1;
              for (let i = bs2; i < fc.length; i++) {
                if (fc[i] === '{') dp++;
                else if (fc[i] === '}') { dp--; if (dp === 0) { be2 = i; break; } }
              }
              if (be2 > bs2) {
                try {
                  const rp = JSON.parse(fc.substring(bs2, be2 + 1));
                  if (rp && rp.replies && Array.isArray(rp.replies) && rp.replies.length > 0) {
                    content = fc.substring(bs2, be2 + 1);
                    raw = rp;
                    this.logger.log('Retry from message.content succeeded');
                  }
                } catch {}
              }
            }
          }
          if (!raw.replies || !Array.isArray(raw.replies) || raw.replies.length === 0) {
            this.logger.warn('Retry failed, using default replies');
            return this.getFallbackResult();
          }

        }

        const result: AnalysisResult = {
          thinking: raw.thinking || '',
          thinkingTags: Array.isArray(raw.thinkingTags) ? raw.thinkingTags : [],
          remind: raw.remind || '',
          remindTags: Array.isArray(raw.remindTags) ? raw.remindTags : [],
          replies: raw.replies.slice(0, 5).map((r: any, idx: number) => ({
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

    // Build dynamic mode pool based on persona
    const personaKey = data.persona || '普通女生';
    const preferredCategories = PERSONA_CATEGORY_MAP[personaKey] || PERSONA_CATEGORY_MAP['普通女生'];
    const candidateModes: string[] = [];
    for (const cat of preferredCategories) {
      if (CATEGORY_MODES[cat]) {
        candidateModes.push(...CATEGORY_MODES[cat]);
      }
    }
    const uniqueModes = [...new Set(candidateModes)];

    prompt += '## 推荐回复模式\n\n';
    prompt += '根据你的"'+ (data.persona || '普通女生') +'"人设，从以下 '+ uniqueModes.length +' 个推荐模式中选择恰好 5 个：\n\n';
    for (let i = 0; i < uniqueModes.length; i++) {
      const m = uniqueModes[i];
      const def = MODE_DEFINITIONS[m] || '';
      prompt += (i + 1) + '. ' + m + (def ? ' — ' + def : '') + '\n';
    }
    prompt += '\n';

    prompt += '## 选择规则\n\n';
    prompt += '1. 必须从上方推荐列表中选择，不要使用列表外的模式\n';
    prompt += '2. 5 个模式之间风格差异要大，涵盖不同类型（稳妥/主动/进攻）\n';
    prompt += '3. 必须符合你的人设性格——你的回复文案的语气要和上面列出的模式定义一致\n';
    prompt += '4. 5 个模式中至少要包含：1 个稳妥型 + 1 个主动型 + 1 个进攻/反击型\n\n';

    prompt += '## 严格格式要求（重要！）\n\n';
    prompt += '你必须且只能使用以下新格式。禁止使用任何旧格式（如 text/style/active/good/rhythm 字段）。\n\n';
    prompt += '每个回复对象必须包含这六个字段：\n';
    prompt += '- "mode": 模式名称（从上方推荐列表中选择）\n';
    prompt += '- "messages": 数组，包含1条回复文案（15字以内）\n';
    prompt += '- "sendHint": 发送建议（30字以内）\n';
    prompt += '- "active": 主动程度 (1-5)，1=被动，5=非常主动\n';
    prompt += '- "good": 好感提升 (1-5)，1=可能减分，5=大幅提升好感\n';
    prompt += '- "rhythm": 节奏标签，从 "自然" / "稍快" / "慢热" / "积极" / "被动" 中选一个\n\n';

    // Generate dynamic example using 5 candidate modes
    const exampleModes = uniqueModes.slice(0, 5);
    const exampleMessages = [
      '那你觉得我是什么态度呀？', '哦', '你怎么突然这么问呀～', '随便你怎么想', '你想知道什么？直接说'
    ];
    const exampleHints = [
      '把问题抛回去，让他自己说', '简短回应，制造一点距离感', '用疑问转移话题，保持可爱',
      '无所谓态度，降低他的期待', '掌握主动权，不绕弯子'
    ];

    prompt += '## 完整输出示例\n\n';
    prompt += '```json\n';
    prompt += '{\n';
    prompt += '  "thinking": "他在试探你的态度，想确认你对他有没有兴趣",\n';
    prompt += '  "thinkingTags": ["试探", "确认意图", "观察态度"],\n';
    prompt += '  "remind": "保持自然，不要过度解读他的一句话",\n';
    prompt += '  "remindTags": ["保持轻松", "不过度解读"],\n';
    prompt += '  "replies": [\n';
    for (let i = 0; i < 5; i++) {
      prompt += '    {\n';
      prompt += '      "mode": "' + exampleModes[i] + '",\n';
      prompt += '      "messages": ["' + exampleMessages[i] + '"],\n';
      prompt += '      "sendHint": "' + exampleHints[i] + '",\n';

      prompt += '      "active": ' + [2, 3, 4, 1, 5][i] + ',\n';
      prompt += '      "good": ' + [4, 5, 4, 3, 5][i] + ',\n';
      prompt += '      "rhythm": "' + ['自然', '稍快', '积极', '慢热', '被动'][i] + '"\n';
      prompt += '    }' + (i < 4 ? ',' : '') + '\n';
    }
    prompt += '  ],\n';
    prompt += '  "communicationTip": "不要急于表态，让他多表达一些"\n';
    prompt += '}\n';
    prompt += '```\n\n';

    prompt += '## 输出格式\n\n';
    prompt += '严格返回以下 JSON（不要任何额外文字，不要 Markdown 代码块标记）：\n\n';
    prompt += '{\n';
    prompt += '  "thinking": "一句话分析对方意图和心态（20字内")",\n';
    prompt += '  "thinkingTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "remind": "一句话沟通提醒（20字内")",\n';
    prompt += '  "remindTags": ["标签1", "标签2", "标签3"],\n';
    prompt += '  "replies": [\n';
    prompt += '    {\n';
    prompt += '      "mode": "从上方推荐列表中选择的一个模式",\n';
    prompt += '      "messages": ["回复文案1（15字以内）"],\n';
    prompt += '      "sendHint": "建议说明（30字内")",\n';
    prompt += '      "active": 2,\n';
    prompt += '      "good": 4,\n';
    prompt += '      "rhythm": "自然"\n';
    prompt += '    },\n';
    prompt += '    ...共 5 个对象\n';
    prompt += '  ],\n';
    prompt += '  "communicationTip": "沟通雷区/建议说明（30字内")"\n';
    prompt += '}\n\n';

    prompt += '## 回复数量强制要求（最重要！）\n\n';
    prompt += '你必须生成恰好 5 条不同的回复建议，不多不少正好 5 条。\n';
    prompt += 'replies 数组中必须有且仅有 5 个对象。\n';
    prompt += '少于 5 条或超过 5 条都视为输出错误，会导致前端无法显示。\n';
    prompt += '每条回复的模式名称必须不同，文案内容也必须不同。\n';
    prompt += '如果不确定某条回复是否合适，宁可多写几句分析也不要省略回复。\n\n';

    prompt += '## 每条回复要求\n\n';
    prompt += '- 每条回复只生成 1 条文案（messages 数组只放 1 个元素）\n';
    prompt += '- 文案控制在 15 字以内，口语化、自然、有实际内容\n';
    prompt += '- 风格要贴合所选模式的定义\n';
    prompt += '- 不要空洞的"嗯""哦""哈哈"\n';
    prompt += '- 不要解释你的行为，不要输出系统信息\n';

    prompt += '每个回复必须标注 active/good/rhythm 评分字段：\n';
    prompt += '- **active** (1-5)：主动程度。1=完全被动，5=非常主动出击\n';
    prompt += '- **good** (1-5)：好感提升。1=可能减分，5=大幅提升好感\n';
    prompt += '- **rhythm**：节奏标签，从 "自然" / "稍快" / "慢热" / "积极" / "被动" 中选一个\n';
    prompt += '评分指南：\n';
    prompt += '- 主动邀约/撩拨类回复：active 4-5, good 4-5\n';
    prompt += '- 稳妥自然类回复：active 2-3, good 3-4\n';
    prompt += '- 高冷/被动类回复：active 1-2, good 2-3\n';
    prompt += '- 根据「我的想法和情绪」中用户的需求调整：用户想约他就给高 active\n';

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
        const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，]]+)'));
        return m2 ? m2[1].trim() : null;
      };
      const ea = (fn: string): string[] => {
        const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*\\[([^\\]]*)'));
        if (m) return m[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
        const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，]]+)'));
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
          er.push({ text: msgs[0] || '', style: mm[1], active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
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
          er.push({ text: msgs[0] || '', style: mm[1], active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
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
          const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，]]+)'));
          return m2 ? m2[1].trim() : null;
        };
        const ea = (fn: string): string[] => {
          const m = prefix.match(new RegExp('"' + fn + '"\\s*:\\s*\\[([^\\]]*)'));
          if (m) return m[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean);
          const m2 = prefix.match(new RegExp(fn + '\\s*[：:]\\s*([^\\n，]]+)'));
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
      er.push({ text: msgs[0] || '', style: m[1], active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
    }
    if (er.length === 0) {
      const rp = /\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/g;
      while ((m = rp.exec(trimmed)) !== null) er.push({ text: m[1], style: m[2], active: Number(m[3]), good: Number(m[4]), rhythm: '自然' });
    }
    if (er.length === 0 && thinking === '' && remind === '') return null;
    while (er.length < 5) er.push({ text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
    return JSON.stringify({ thinking: thinking || '对方主动联系你，希望能继续互动。',
      thinkingTags: ['主动发起'],
      remind: remind || '保持自然节奏，观察对方投入程度。',
      remindTags: ['保持轻松'],
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
      er.push({ text: msgs[0] || '', style: m[1], active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
    }
    if (er.length === 0) {
      const rp = /\{\s*"text"\s*:\s*"([^"]*)"[^}]*"style"\s*:\s*"([^"]*)"[^}]*"active"\s*:\s*(\d+)[^}]*"good"\s*:\s*(\d+)/g;
      while ((m = rp.exec(trimmed)) !== null) er.push({ text: m[1], style: m[2], active: Number(m[3]), good: Number(m[4]), rhythm: '自然' });
    }
    if (er.length === 0 && thinking === '' && remind === '') return null;
    while (er.length < 5) er.push({ text: '哈哈可以呀～你有什么推荐的吗？', style: '自然', active: [2, 3, 1, 4, 1][er.length % 5], good: [4, 5, 3, 5, 2][er.length % 5], rhythm: ['自然', '稍快', '慢热', '积极', '被动'][er.length % 5] });
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
