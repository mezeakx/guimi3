# DeepSeek 接口 Prompt 设计与消息审核机制

> 基于「闺蜜帮你回」小程序前端页面所有功能，为 DeepSeek API 设计的 System Prompt 规范及内容安全审核机制。

---

## 一、产品概览

「闺蜜帮你回」是一款面向女性用户的 AI 聊天回复建议工具。用户输入男方的消息，结合自己的人设、联系人设定、关系状态、前情提要、聊天节奏等上下文，由 AI 生成 3 条不同风格的回复建议，并附带男方意图分析和风险提示。

**核心角色定位：** 一位成熟、理性、有同理心的女性聊天军师（闺蜜视角），根据用户选择的人设来生成贴合其性格特征的回复。

---

## 二、输入数据结构

前端通过 `POST /analysis/generate` 向后端发送分析请求，后端组装后调用 DeepSeek API。以下是完整的输入字段：

### 2.1 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `message` | string | 男方的消息内容（文字或 OCR 识别结果） | "周末有空吗？一起去看电影吧" |
| `identity` | string | 联系人身份标签 | "暗恋对象" |
| `target` | string | 回复目标 | "提升好感" |
| `style` | string | 回复风格标签 | "温柔" |

### 2.2 可选字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `context` | string | 前情提要 | "我们刚认识一周，他平时比较主动" |
| `pace` | number | 聊天节奏档位（0-100） | 25 |
| `selected_relationships` | array | 关系状态标签 | ["恋爱中", "异地"] |
| `selected_thoughts` | array | 用户想法标签 | ["想让他主动", "想约他出来"] |
| `thought_custom` | string | 用户自定义想法补充 | "但我今天有点累不想出门" |
| `contact_id` | string | 联系人 ID | "1" |
| `contact_nickname` | string | 联系人昵称 | "阿杰" |
| `identity_labels` | array | 联系人所有身份标签 | ["暗恋对象", "年上"] |
| `style_labels` | array | 联系人风格标签 | ["温柔", "可爱"] |
| `selected_persona` | string | 用户自己的人设 | "纯情女大" |

### 2.9 我的人设选项详解

| 人设值 | 标签 | 特点 | 示例 |
|--------|------|------|------|
| 普通女生 | 普通女生 | 喜欢自然真实地聊天，不会刻意撩人，也不会故意高冷，表达舒服有礼貌，适合大多数场景 | "哈哈可以呀\n你说的那个地方我没去过呢" |
| 纯情女大 | 纯情女大 | 容易害羞，不太会主动，喜欢慢慢熟悉，不喜欢太直接，偶尔会嘴硬但其实很好哄 | "嗯……我考虑一下\n也不是很想去啦" |
| 温柔姐姐 | 温柔姐姐 | 喜欢用温柔体贴的方式表达，很少发脾气，不喜欢争吵，不喜欢过度卖萌，更注重照顾对方感受 | "辛苦啦~\n要不要一起吃个饭放松一下？" |
| 元气少女 | 元气少女 | 喜欢轻松愉快地聊天，经常使用表情和感叹词，热情开朗，擅长制造聊天氛围 | "好耶！终于有空啦～\n我们快去快回！✨" |
| 甜妹 | 甜妹 | 喜欢可爱软萌的表达方式，经常使用颜文字表情和语气词，偶尔会撒娇希望对方多关注自己 | "好呀好呀 (◍•ᴗ•◍)\n你真好～" |
| 钓系御姐 | 钓系御姐 | 不会把喜欢表现得太明显，擅长制造若即若离的感觉，偶尔会撩人但始终保持分寸感 | "是吗？那看你表现咯" |
| 霸气女王 | 霸气女王 | 说话自信有主见，不喜欢讨好别人也不会委屈自己，喜欢平等直接的交流方式 | "行啊，我来定\n周六晚上七点" |
| 酷女孩 | 酷女孩 | 不喜欢矫情和过度拉扯，态度随性偶尔耍酷，更喜欢像朋友一样自然相处 | "行吧\n不过我可不是因为想你才说的哦" |
| 成熟理性派 | 成熟理性派 | 更注重逻辑和沟通效率，很少情绪化表达，遇到问题喜欢直接沟通和解决 | "我觉得我们可以好好聊聊\n说说你的想法" |
| 抽象搞笑女 | 抽象搞笑女 | 喜欢玩梗接梗和整活，聊天主打一个有趣不喜欢太严肃，即使表达喜欢也会带点幽默感 | "你这是在跟我表白吗\n那我先考虑一下要不要接受 (^_^)" |

### 2.3 聊天节奏档位详解

| 档位 | 名称 | 特征 |
|------|------|------|
| 0% | 直球模式 | 有话直说，不绕弯 |
| 25% | 自然模式 | 真实表达，不刻意设计 |
| 50% | 慢热模式 | 表达但保留空间 |
| 75% | 暧昧模式 | 不说透，让对方接话 |
| 100% | 拉扯模式 | 制造猜测，保留神秘感 |

### 2.4 关系状态标签

| 标签 | 分组 | 说明 |
|------|------|------|
| 暧昧中 | neutral | 双方处于暧昧阶段 |
| 刚认识 | neutral | 初次接触不久 |
| 被追求中 | neutral | 对方在追自己 |
| 恋爱中 | neutral | 已经在一起 |
| 冷战中 | neutral | 正在冷战 |
| 刚吵架 | mutually_exclusive_1 | 最近刚吵过架 |
| 刚和好 | mutually_exclusive_1 | 刚和好（与"刚吵架"互斥） |
| 异地 | neutral | 异地状态 |
| 刚约会完 | neutral | 最近刚约会过 |
| 我主动较多 | mutually_exclusive_2 | 自己更主动 |
| 他主动较多 | mutually_exclusive_2 | 对方更主动（与"我主动较多"互斥） |

### 2.5 我的想法分类

| 分类 | 标签选项 |
|------|----------|
| 好感升温 | 想让他主动、想约他出来、想暗示有好感、想表达欣赏、想表达想念、想让他反思一下、想让他哄我、想表达感谢 |
| 我的情绪 | 有点委屈、有点吃醋、有点生气、有点失落、有点不耐烦 |
| 保持距离 | 想委婉拒绝、想表达不满、想保持朋友关系、不想见面、想结束话题、想委婉拒绝邀约、想慢慢疏远 |
| 观察试探 | 想试探他的想法、想看看他会不会主动、想确认关系进展、想测试他的诚意 |
| 表达方式 | 不想显得太主动、想保持神秘感、想表现得成熟一点、想显得有边界感、想自然一点、不想秒答应、想留点余地 |
| 复合场景 | 还没完全放下、想重新了解他、想给一次机会、想拒绝复合、不想重蹈覆辙 |

### 2.6 联系人身份选项

现实情侣、暗恋对象、暧昧对象、追求者、男神、相亲对象、网恋对象、约会对象、前任、饭搭子、好朋友、普通朋友、发小、同学、家里介绍、同事、上司、客户、网友、游戏搭子、想拒绝的人、大佬、年上、年下

### 2.7 回复目标选项

先了解他、提升好感、保持暧昧、让他主动、保持朋友、委婉拒绝

### 2.8 回复风格选项

温柔、幽默、高冷、可爱、成熟姐姐、理性、自然随性、撩人、傲娇、友善、夸夸、吐槽

---

## 三、System Prompt 完整设计

### 3.1 核心 System Prompt

```
你是一位成熟理性的女性聊天军师，名叫「闺蜜军师」。你擅长分析男女交往中的微妙心理，为用户提供真实、得体、有温度的回复建议。

你的核心能力：
1. 精准解读男生的消息背后的真实意图
2. 根据用户设定的关系状态、聊天节奏、个人想法，生成贴合心意的回复
3. 给出客观的风险提醒，帮助用户避免踩坑

你的回复风格要求：
- 语言自然口语化，像闺蜜聊天一样真实
- 每条回复控制在 20-50 字以内，不宜过长
- 避免书面语和生硬表达，但也不要过度使用语气词，保持日常聊天的自然感
- 不使用 PUA 技巧、情感操控手段
- 不做虚假承诺（如"这样一定能让他喜欢你"）

根据用户的人设生成回复，确保语气与人设一致：
- 普通女生：自然真实，不刻意撩也不高冷，有礼貌
- 纯情女大：带点害羞和犹豫，偶尔嘴硬，语气偏软
- 温柔姐姐：温柔体贴，不卖萌不争吵，照顾对方感受
- 元气少女：热情开朗，多用感叹词和表情，活泼有活力
- 甜妹：可爱软萌，用颜文字和语气词，偶尔撒娇
- 钓系御姐：若即若离，偶尔撩但不越界，保持神秘感
- 霸气女王：自信果断，不讨好不委屈，平等直接
- 酷女孩：随性洒脱，偶尔耍酷，像朋友一样自然
- 成熟理性派：逻辑清晰，不情绪化，直接沟通解决问题
- 抽象搞笑女：玩梗接梗，幽默有趣，善用网络热梗

输出格式要求：
你必须且仅返回一个合法的 JSON 对象，不要包含任何其他文字、Markdown 标记或解释。JSON 格式如下：
{
  "reply_A": "回复建议一（风格一）",
  "reply_B": "回复建议二（风格二）",
  "reply_C": "回复建议三（风格一+风格二）",
  "boy_intent": "对男生意图的分析（50字以内）",
  "risk_warning": "风险提示（50字以内，如无风险可返回'暂无明显风险'）",
  "thinking_tags": ["标签1", "标签2", "标签3"],
  "remind_tags": ["标签1", "标签2"]
}

各字段说明：
- reply_A：使用联系人选定的第一种回复风格生成（如用户只选了1种风格则为该风格，如选了2种则为风格一+风格二）
- reply_B：使用联系人选定的第二种回复风格生成（如用户只选了1种风格则为该风格+自然，如选了2种则为风格二）
- reply_C：使用联系人选定的两种风格组合生成（如用户只选了1种风格则为该风格+自然）
- boy_intent：分析男生发消息的真实心理和意图
- risk_warning：当前情况下需要注意的风险点
- thinking_tags：男生意图的关键标签（3-5个）
- remind_tags：风险提醒的关键标签（1-3个）

风格组合规则：
- 用户选了2种风格（如温柔、可爱）：reply_A=温柔，reply_B=可爱，reply_C=温柔+可爱
- 用户只选了1种风格（如温柔）：reply_A=温柔，reply_B=温柔，reply_C=温柔+自然
- 用户没选风格：reply_A=稳妥自然，reply_B=稳妥自然，reply_C=稳妥自然+自然

安全红线：
- 绝不生成包含色情、露骨、性暗示内容的回复
- 绝不生成包含暴力、威胁、恐吓内容的回复
- 绝不生成包含政治敏感、仇恨言论、歧视内容的回复
- 绝不生成教唆用户欺骗、操控、伤害他人的回复
- 当检测到用户输入包含违规内容时，返回以下安全 JSON：
{
  "reply_A": "抱歉，我无法帮你生成这条消息的回复建议",
  "reply_B": "请尝试用更合适的方式表达",
  "reply_C": "抱歉，这个请求超出了我的服务范围",
  "boy_intent": "无法分析",
  "risk_warning": "消息内容不符合社区规范，请修改后重试",
  "thinking_tags": [],
  "remind_tags": ["内容违规"]
}
```

### 3.2 动态 Prompt 组装逻辑

后端在调用 DeepSeek API 时，应将前端传入的各个模块数据组装成完整的 user message。以下是组装规则和优先级：

#### 3.2.1 消息组装模板

```
【男生消息】
{message}

【联系人信息】
昵称：{contact_nickname}
身份：{identity_labels}
回复目标：{target}
回复风格：{style_labels}

【关系状态】
{selected_relationships}

【聊天节奏】
{pace_description}

【我的人设】
{persona_description}

【我的想法】
{selected_thoughts}
{thought_custom}

【前情提要】
{context}
```

#### 3.2.2 各模块组装规则

1. **男生消息（必填）**：直接使用 `message` 字段，不做任何修改

2. **联系人信息**：
   - 如果 `contact_nickname` 为空，显示"未命名"
   - `identity_labels` 为数组时用逗号分隔
   - `style_labels` 为数组时用逗号分隔
   - 如果整个联系人信息都为空，省略该模块

3. **关系状态**：
   - `selected_relationships` 为数组时用逗号分隔
   - 如果为空，显示"未指定"

4. **聊天节奏**：
   - 根据 `pace` 数值（0-100）转换为对应的档位描述
   - 0% → "直球模式：有话直说，不绕弯"
   - 25% → "自然模式：真实表达，不刻意设计"
   - 50% → "慢热模式：表达但保留空间"
   - 75% → "暧昧模式：不说透，让对方接话"
   - 100% → "拉扯模式：制造猜测，保留神秘感"
   - 中间值就近取整
   - 如果为空，显示"自然模式（默认）"

5. **我的人设**：
   - `selected_persona` 非空时，展示对应的人设名称、特点描述和示例
   - 如果为空，显示"普通女生（默认）"
   - 人设决定了 AI 生成回复时的"用户说话方式"，即用户本人应该呈现出的性格特征

6. **我的想法**：
   - `selected_thoughts` 为数组时用逗号分隔
   - `thought_custom` 为非空时附加在想法列表后面，标注"补充想法："
   - 如果都为空，省略该模块

7. **前情提要**：
   - `context` 非空则直接展示
   - 为空则省略该模块

#### 3.2.3 示例：完整消息组装

```
【男生消息】
周末有空吗？一起去看电影吧

【联系人信息】
昵称：阿杰
身份：暗恋对象
回复目标：提升好感
回复风格：温柔, 可爱

【关系状态】
暧昧中, 他主动较多

【聊天节奏】
自然模式：真实表达，不刻意设计

【我的人设】
人设：纯情女大
特点：容易害羞，不太会主动；喜欢慢慢熟悉，不喜欢太直接；偶尔会嘴硬但其实很好哄
示例：嗯……我考虑一下 / 也不是很想去

【我的想法】
想约他出来, 想暗示有好感
补充想法：但我今天有点累不想出门

【前情提要】
我们刚认识一周，他平时比较主动，这次是第一次约我
```

### 3.3 特殊场景处理

#### 3.3.1 委婉拒绝场景

当用户的回复目标为"委婉拒绝"或想法中包含"想委婉拒绝"、"不想见面"、"想慢慢疏远"时，AI 需要特别注意：
- 回复要有礼貌但不给对方错误期望
- 语气要温和但态度要明确
- 避免使用过于热情的语气词

#### 3.3.2 冷战中场景

当关系状态包含"冷战中"或"刚吵架"时：
- 分析要考虑双方的情绪状态
- 回复建议要有助于缓和关系（除非用户选择拒绝）
- 风险提示要关注情绪升级的可能

#### 3.3.3 拉扯/暧昧模式

当聊天节奏为 75% 或 100% 时：
- 回复要有悬念感，不把话说满
- 适当使用反问句引导对方继续
- 避免直接答应或拒绝

#### 3.3.4 直球模式

当聊天节奏为 0% 时：
- 回复可以直接表达意愿
- 不需要过多包装和暗示
- 语言简洁明了

---

## 四、消息审核机制

### 4.1 审核架构总览

```
用户输入 ──→ 前端基础校验 ──→ 后端第一道审核（关键词匹配） ──→ 后端第二道审核（DeepSeek 安全判定） ──→ AI 分析 ──→ AI 输出审核 ──→ 返回前端
```

审核分为三层：前端基础校验、后端关键词预检、AI 语义级判定。

### 4.2 第一层：前端基础校验

在用户点击"生成回复建议"之前，前端进行基础输入校验：

```javascript
// pages/index/index.js — generateReply() 前置校验
validateInput() {
  // 1. 内容长度限制
  const messageLen = this.data.message.length
  if (messageLen > 500) {
    showToast('消息不能超过500字')
    return false
  }

  // 2. 前情提要长度限制
  const contextLen = this.data.context.length
  if (contextLen > 100) {
    showToast('前情提要不超��100字')
    return false
  }

  // 3. 自定义想法长度限制
  if (this.data.thoughtCustom.length > 200) {
    showToast('补充想法不能超过200字')
    return false
  }

  // 4. 敏感字符检测（emoji、特殊符号过滤）
  if (containsSuspiciousSymbols(this.data.message)) {
    showToast('包含非法字符，请修改后重试')
    return false
  }

  return true
}
```

### 4.3 第二层：后端关键词预检（快速拦截）

在调用 DeepSeek API 之前，后端通过关键词匹配进行快速拦截。关键词库按类别管理：

#### 4.3.1 审核关键词库

```typescript
// backend/src/modules/content-moderation/moderation.keywords.ts

export const MODERATION_KEYWORDS = {
  // 色情类
  pornographic: [
    '做爱', '性交', '裸体', '色情', '淫秽', '性器官', '自慰', '手淫',
    'AV', '三级片', '性服务', '援交', '包养', '妓女', '嫖娼', '约炮',
    '一夜情', '开房', '肉搏', '床戏', '情趣内衣', '丝袜诱惑', '奶子',
    '逼', '屌', '操你', '干你', '日你', '舔', '口交', '肛交',
    '性爱', '性幻想', '性骚扰', '性变态', '性冷淡', '性取向',
    '黄片', '毛片', '视频性', '性爱姿势', '高潮', '射精', '前列腺',
  ],

  // 暴力类
  violent: [
    '杀人', '捅死', '弄死你', '打死', '砍死', '枪毙', '炸死',
    '绑架', '劫持', '撕票', '灭口', '暗杀', '谋杀', '奸杀',
    '强奸', '轮奸', '性侵', '猥亵', '施暴', '家暴', '殴打',
    '毒死', '下毒', '烧死', '淹死', '勒死', '割腕', '跳楼',
    '自杀', '自残', '割喉', '爆头', '碎尸', '分尸', '肢解',
    '黑帮', '火拼', '枪战', '恐怖袭击', '炸弹', '爆炸物',
  ],

  // 政治敏感类
  political: [
    '天安门', '法轮功', '六四', '达赖', '藏独', '疆独', '台独',
    '共产党', '习近平', '李克强', '胡锦涛', '江泽民', '温家宝',
    '政治局', '常委', '党代会', '两会', '文革', '大跃进', '反右',
    '六四', '八九', '民主运动', '自由化', '资产阶级', '无产阶级',
    '社会主义', '资本主义', '国民党', '民进党', '台湾独立',
    '香港独立', '西藏独立', '新疆独立', '蒙古独立',
    '政府', '国家主席', '总书记', '总理', '人大', '政协',
    '审查', '封杀', '禁言', '删帖', '屏蔽', '墙', '翻墙',
    'VPN', '代理IP', 'Tor', '暗网',
  ],

  // 违法类
  illegal: [
    '贩毒', '制毒', '吸毒', '赌博', '洗钱', '诈骗', '抢劫',
    '盗窃', '走私', '传销', '非法集资', '高利贷', '放贷',
    '假证', '假币', '偷税', '漏税', '逃税', '行贿', '受贿',
    '拐卖', '人口买卖', '贩卖妇女', '儿童买卖',
    '黑客', '入侵', '盗号', '撞库', 'DDoS', '木马', '病毒',
  ],

  // 仇恨与歧视类
  hate: [
    '女权', '女拳', '男权', '种族', '民族', '地域歧视',
    '残疾人', '智障', '傻子', '弱智', '脑瘫', '精神病',
    '同性恋', '变性', 'LGBT', ' gay', 'lesbian',
    '外国人', '鬼子', '棒子', '猴子', '支那',
    '乡下人', '农民工', '妓女', '婊子', '荡妇', '小三',
    '婚外情', '出轨', '绿帽', '戴绿帽',
  ],

  // 其他违规类
  other: [
    '广告', '微商', '刷单', '兼职', '投资', '理财', '股票推荐',
    '代孕', ' surrogacy', '器官买卖', '人体实验',
    '邪教', '迷信', '风水', '算命', '占卜', '驱魔',
  ],
}

// 审核等级定义
export enum ModerationLevel {
  PASS = 'pass',        // 通过
  WARN = 'warn',        // 警告，人工审核
  REJECT = 'reject',    // 拒绝，直接拦截
}

// 关键词到等级的映射
export const KEYWORD_LEVEL_MAP: Record<string, ModerationLevel> = {
  pornographic: 'reject',
  violent: 'reject',
  political: 'reject',
  illegal: 'reject',
  hate: 'warn',
  other: 'warn',
}
```

#### 4.3.2 关键词预检服务

```typescript
// backend/src/modules/content-moderation/moderation.service.ts

import { Injectable } from '@nestjs/common';
import { MODERATION_KEYWORDS, KEYWORD_LEVEL_MAP, ModerationLevel } from './moderation.keywords';

@Injectable()
export class ModerationService {
  // 构建正则表达式（支持模糊匹配）
  private buildPatterns(category: string[]): RegExp[] {
    return category.map(keyword => {
      // 转义特殊字符
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 允许中间有少量干扰字符（防绕过）
      return new RegExp(escaped, 'i');
    });
  }

  // 缓存编译后的正则
  private compiledPatterns: Map<string, RegExp[]> = new Map();

  private getPatterns(category: string): RegExp[] {
    if (!this.compiledPatterns.has(category)) {
      const keywords = MODERATION_KEYWORDS[category];
      if (keywords) {
        this.compiledPatterns.set(category, this.buildPatterns(keywords));
      }
    }
    return this.compiledPatterns.get(category) || [];
  }

  /**
   * 审核文本内容
   * @param text 待审核文本
   * @returns 审核结果
   */
  async check(text: string): Promise<{
    passed: boolean;
    level: ModerationLevel;
    matchedCategories: string[];
    matchedKeywords: string[];
    message: string;
  }> {
    if (!text || text.trim().length === 0) {
      return {
        passed: true,
        level: ModerationLevel.PASS,
        matchedCategories: [],
        matchedKeywords: [],
        message: '',
      };
    }

    const matchedCategories: string[] = [];
    const matchedKeywords: string[] = [];

    // 遍历所有类别
    for (const [category, keywords] of Object.entries(MODERATION_KEYWORDS)) {
      const patterns = this.getPatterns(category);
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          matchedCategories.push(category);
          matchedKeywords.push(match[0]);
          break; // 每个类别只需匹配到一次
        }
      }
    }

    if (matchedCategories.length === 0) {
      return {
        passed: true,
        level: ModerationLevel.PASS,
        matchedCategories: [],
        matchedKeywords: [],
        message: '',
      };
    }

    // 判断最高审核等级
    let highestLevel: ModerationLevel = ModerationLevel.WARN;
    for (const category of matchedCategories) {
      const level = KEYWORD_LEVEL_MAP[category] || ModerationLevel.WARN;
      if (level === ModerationLevel.REJECT) {
        highestLevel = ModerationLevel.REJECT;
        break;
      }
    }

    const categoryNames = {
      pornographic: '色情内容',
      violent: '暴力内容',
      political: '政治敏感内容',
      illegal: '违法内容',
      hate: '仇恨歧视内容',
      other: '其他违规内容',
    };

    const categoryDisplay = matchedCategories.map(c => categoryNames[c] || c).join('、');

    if (highestLevel === ModerationLevel.REJECT) {
      return {
        passed: false,
        level: ModerationLevel.REJECT,
        matchedCategories,
        matchedKeywords,
        message: `检测到${categoryDisplay}，无法提供相关建议。请遵守社区规范，使用文明用语。`,
      };
    }

    return {
      passed: true, // warn 级别仍然放行，但记录日志
      level: ModerationLevel.WARN,
      matchedCategories,
      matchedKeywords,
      message: `内容可能涉及${categoryDisplay}，已记录。`,
    };
  }
}
```

### 4.4 第三层：DeepSeek 安全判定（语义级审核）

关键词匹配只能拦截已知模式，DeepSeek 的语义理解能发现绕过关键词的隐晦违规内容。

#### 4.4.1 安全判定 System Prompt

```
你是一个内容安全审核员。你的任务是判断用户提交的消息是否包含违规内容。

违规内容定义：
1. 色情内容：露骨的性行为描述、性暗示、性挑逗
2. 暴力内容：威胁伤害他人、自残自杀计划、极端暴力
3. 政治敏感：涉及国家领导人、政治体制、敏感政治事件
4. 违法内容：毒品、赌博、诈骗、盗窃等违法犯罪行为
5. 仇恨歧视：针对特定群体的侮辱、歧视、攻击
6. 其他：严重违反社区规范的内容

判断规则：
- 如果消息包含以上任一类型的违规内容，返回 {"safe": false, "reason": "具体原因"}
- 如果消息是正常的聊天内容（即使是争吵、分手、暧昧），返回 {"safe": true, "reason": "内容安全"}
- 注意：普通的感情纠纷、争吵、暧昧对话不属于违规内容
- 只有明显越界的内容才判定为不安全

你必须且仅返回一个合法的 JSON 对象，不要包含任何其他文字或标记。
```

#### 4.4.2 安全判定流程

```typescript
// backend/src/modules/content-moderation/moderation.service.ts 续

async checkSafetyWithAI(text: string): Promise<{ safe: boolean; reason: string }> {
  const systemPrompt = `你是一个内容安全审核员。你的任务是判断用户提交的消息是否包含违规内容。

违规内容定义：
1. 色情内容：露骨的性行为描述、性暗示、性挑逗
2. 暴力内容：威胁伤害他人、自残自杀计划、极端暴力
3. 政治敏感：涉及国家领导人、政治体制、敏感政治事件
4. 违法内容：毒品、赌博、诈骗、盗窃等违法犯罪行为
5. 仇恨歧视：针对特定群体的侮辱、歧视、攻击
6. 其他：严重违反社区规范的内容

判断规则：
- 如果消息包含以上任一类型的违规内容，返回 {"safe": false, "reason": "具体原因"}
- 如果消息是正常的聊天内容（即使是争吵、分手、暧昧），返回 {"safe": true, "reason": "内容安全"}
- 注意：普通的感情纠纷、争吵、暧昧对话不属于违规内容
- 只有明显越界的内容才判定为不安全

你必须且仅返回一个合法的 JSON 对象，不要包含任何其他文字或标记。
{
  "safe": true,
  "reason": "内容安全"
}`;

  try {
    const response = await axios.post(
      `${this.aiBaseUrl}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.aiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 安全审核超时5秒
      },
    );

    let content = response.data.choices[0].message.content;
    content = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) content = jsonMatch[0];

    return JSON.parse(content);
  } catch (error) {
    // 安全审核失败时保守放行（不过度拦截正常用户）
    return { safe: true, reason: '审核服务暂不可用，已放行' };
  }
}
```

### 4.5 AI 输出审核

不仅用户输入需要审核，AI 生成的回复也需要二次审核，确保输出安全。

#### 4.5.1 输出审核 System Prompt

```
你是一个内容安全审核员。你的任务是判断 AI 生成的回复建议是否包含违规内容。

违规内容定义：
1. 色情内容：露骨的性行为描述、性暗示
2. 暴力内容：威胁伤害他人、极端暴力
3. 政治敏感：涉及政治内容
4. 违法内容：教唆违法犯罪
5. 仇恨歧视：针对特定群体的侮辱、歧视

判断规则：
- 如果回复包含以上任一类型的违规内容，返回 {"safe": false, "reason": "具体原因"}
- 如果回复是正常的聊天建议，返回 {"safe": true, "reason": "内容安全"}

你必须且仅返回一个合法的 JSON 对象。
```

#### 4.5.2 输出审核流程

```typescript
async checkOutputSafety(replies: AnalysisResult): Promise<{ safe: boolean; reason: string }> {
  const combinedText = [
    replies.reply_A,
    replies.reply_B,
    replies.reply_C,
    replies.boy_intent,
    replies.risk_warning,
  ].join('\n');

  return this.checkContentWithAI(combinedText, 'output');
}
```

### 4.6 审核结果处理策略

```
第一层（关键词）检测到 REJECT
  └─→ 直接拦截，返回前端：「检测到违规内容，请修改后重试」
  └─→ 记录日志，上报违规事件

第一层（关键词）检测到 WARN
  └─→ 继续第二层（DeepSeek 语义审核）
  └─→ DeepSeek 判定 unsafe
      └─→ 拦截，返回前端：「内容不符合规范，请修改后重试」
  └─→ DeepSeek 判定 safe
      └─→ 放行，记录日志供人工审核

第一层（关键词）PASS
  └─→ 继续第二层（DeepSeek 语义审核）
  └─→ DeepSeek 判定 unsafe
      └─→ 拦截，返回前端：「内容不符合规范，请修改后重试」
  └─→ DeepSeek 判定 safe
      └─→ 继续 AI 分析流程

AI 输出审核 UNSAFE
  └─→ 使用兜底回复替代，返回前端：「生成失败，请重试」
  └─→ 记录日志，人工复核
```

### 4.7 前端拦截提示文案

| 场景 | 提示文案 |
|------|---------|
| 关键词拦截 | "检测到违规内容，请修改后重试" |
| 语义拦截 | "消息内容不符合社区规范，请修改后重试" |
| 输出拦截 | "生成结果异常，请重试" |
| 审核服务不可用 | "审核服务暂时不可用，已放行" |
| 内容长度超限 | "消息不能超过500字" |

---

## 五、API 请求与响应规范

### 5.1 请求结构

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "{3.1 节的核心 System Prompt}"
    },
    {
      "role": "user",
      "content": "{3.2 节组装的动态消息}"
    }
  ],
  "response_format": {
    "type": "json_object"
  }
}
```

### 5.2 响应结构

DeepSeek 返回的 JSON 必须包含以下字段：

```json
{
  "reply_A": "哈哈可以呀～不过我对那边不太熟，你有什么推荐吗？",
  "reply_B": "听起来还不错～有机会可以一起去看看呀～",
  "reply_C": "怎么突然想约我啦～",
  "boy_intent": "他主动约你看电影，说明对你有好感，希望进一步拉近关系。",
  "risk_warning": "刚认识一周就单独约会，建议先了解他的真实意图，注意安全。",
  "thinking_tags": ["对你有兴趣", "想继续话题", "期待你给出反馈"],
  "remind_tags": ["不要立刻答应见面", "先继续聊天观察"]
}
```

### 5.3 前端展示映射

| 后端返回字段 | 前端展示位置 | 展示内容 |
|-------------|-------------|---------|
| `reply_A` | 推荐回复 A | 文本 + 风格标签 |
| `reply_B` | 推荐回复 B | 文本 + 风格标签 |
| `reply_C` | 推荐回复 C | 文本 + 风格标签 |
| `boy_intent` | 他可能在想 | 分析文本 |
| `risk_warning` | 闺蜜提醒 | 提醒文本 |
| `thinking_tags` | 他可能在想下方 | 标签列表 |
| `remind_tags` | 闺蜜提醒下方 | 标签列表 |

---

## 六、Prompt 优化建议

### 6.1 温度参数

建议使用 `temperature: 0.7-0.8`，平衡创意性和稳定性。

### 6.2 最大输出 token

建议 `max_tokens: 1024`，足够容纳 JSON 输出和足够的分析深度。

### 6.3 频率惩罚

建议 `frequency_penalty: 0.3`，避免回复过于套路化。

### 6.4 多次采样

DeepSeek 支持 `n` 参数，但当前后端只取第一条结果。如需多版本，可在前端实现"再生成3条"功能时重新调用 API。

---

## 七、容错和安全机制

### 7.1 Markdown 清洗

AI 可能返回 ````json ... ```` 包裹的内容，后端需清洗：
```
content.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
```

### 7.2 JSON 提取

使用正则提取第一个合法的 JSON 对象：
```
content.match(/\{[\s\S]*?\}/)[0]
```

### 7.3 兜底回复

如果 JSON 解析失败或 AI 调用异常，返回默认回复：
```json
{
  "reply_A": "哈哈刚看到消息～",
  "reply_B": "最近有点忙呢～",
  "reply_C": "谢谢你的消息～",
  "boy_intent": "暂时无法分析",
  "risk_warning": "系统繁忙，请稍后重试",
  "thinking_tags": [],
  "remind_tags": []
}
```

### 7.4 安全约束

System Prompt 中已内置以下禁止事项：
- 禁止 PUA 技巧
- 禁止情感操控
- 禁止虚假承诺
- 禁止攻击性表达
- 禁止生成色情、暴力、政治敏感内容

这些约束在 System Prompt 中明确声明，DeepSeek 模型会遵循。

### 7.5 审核日志

所有审核结果（包括拦截和放行）都需要记录日志，便于后续审计和问题排查：

```typescript
// 审核日志数据结构
interface ModerationLog {
  id: string;              // 日志 ID
  openid: string;          // 用户 ID
  timestamp: Date;         // 时间戳
  action: 'input_check' | 'output_check'; // 审核动作
  level: ModerationLevel;  // 审核等级
  matchedKeywords: string[]; // 命中的关键词
  category: string;        // 违规类别
  textSnippet: string;     // 被审核文本摘要（前50字）
  result: 'pass' | 'reject'; // 审核结果
}
```

---

## 八、与现有代码的对应关系

| Prompt 模块 | 对应代码位置 |
|------------|-------------|
| System Prompt | `backend/src/modules/analysis/analysis.service.ts` → `buildSystemPrompt()` |
| 消息组装 | 同上，`analyze()` 方法中构造 user message |
| 身份选项 | `frontend/miniprogram/pages/contact-create/contact-create.js` → `identities` 数组 |
| 回复目标 | 同上 → `targets` 数组 |
| 回复风格 | 同上 → `styles` 数组 |
| 聊天节奏 | `frontend/miniprogram/pages/index/index.js` → `paceLevels` 数组 |
| 我的人设 | 同上 → `personaOptions` 数组 |
| 关系状态 | 同上 → `relationshipOptions` 数组 |
| 我的想法 | 同上 → `thoughtCategories` / `thoughtOptions` 对象 |
| JSON 解析 | `backend/src/modules/analysis/analysis.service.ts` → `analyze()` 方法 |
| 兜底回复 | 同上 → `getFallbackResult()` 方法 |
| 前端基础校验 | `frontend/miniprogram/pages/index/index.js` → `generateReply()` |
| 审核服务（新增） | `backend/src/modules/content-moderation/moderation.service.ts` |
| 审核关键词库（新增） | `backend/src/modules/content-moderation/moderation.keywords.ts` |

---

## 九、新增模块：内容安全审核模块

### 9.1 目录结构

```
backend/src/modules/content-moderation/
├── moderation.module.ts      # 模块注册
├── moderation.service.ts     # 审核服务（关键词 + AI 双重审核）
├── moderation.keywords.ts    # 审核关键词库
├── moderation.controller.ts  # 可选：独立审核接口
└── dto/
    └── check.dto.ts          # 审核请求 DTO
```

### 9.2 moderation.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Module({
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
```

### 9.3 集成到 AnalysisModule

```typescript
// 在 analysis.module.ts 中引入 ModerationModule
import { ModerationModule } from '../content-moderation/moderation.module';

@Module({
  imports: [ModerationModule],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
```

### 9.4 在 AnalysisService 中集成审核

```typescript
// 在 analyze() 方法开头加入审核
async analyze(openid: string, data: any): Promise<{ success: boolean; data: AnalysisResult }> {
  // 1. 前端基础校验已通过（前端拦截）
  // 2. 后端关键词预检
  const keywordResult = await this.moderationService.check(data.message);
  if (!keywordResult.passed && keywordResult.level === ModerationLevel.REJECT) {
    return {
      success: true,
      data: {
        reply_A: '抱歉，我无法帮你生成这条消息的回复建议',
        reply_B: '请尝试用更合适的方式表达',
        reply_C: '抱歉，这个请求超出了我的服务范围',
        boy_intent: '无法分析',
        risk_warning: keywordResult.message,
      }
    };
  }

  // 3. DeepSeek 语义级安全审核
  const aiSafetyResult = await this.moderationService.checkSafetyWithAI(data.message);
  if (!aiSafetyResult.safe) {
    return {
      success: true,
      data: {
        reply_A: '抱歉，我无法帮你生成这条消息的回复建议',
        reply_B: '请尝试用更合适的方式表达',
        reply_C: '抱歉，这个请求超出了我的服务范围',
        boy_intent: '无法分析',
        risk_warning: aiSafetyResult.reason,
      }
    };
  }

  // 4. 继续正常的 AI 分析流程...
  const systemPrompt = this.buildSystemPrompt(data);
  // ... 原有逻辑
}
```

---

## 十、版本演进方向

根据 V2/V3 规划，未来可能需要扩展的 Prompt 能力：

1. **多轮对话记忆**：在 user message 中追加最近的对话历史
2. **关系趋势分析**：增加基于历史数据的长期关系评估能力
3. **个性化风格学习**：根据用户的历史评分调整回复风格偏好
4. **多语言支持**：增加对不同地区用语习惯的支持
5. **审核词库持续更新**：定期根据用户实际输入数据更新关键词库
6. **审核策略可配置**：通过环境变量或管理后台动态调整审核严格度
