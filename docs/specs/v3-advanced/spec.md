# V3 高级功能 Spec

## 概述

本文档定义「闺蜜代回复」第三阶段（高级功能）的详细开发规格。

**目标：** 在 V1/V2 稳定运行后迭代高级功能
**优先级：** P2 后续迭代

---

## 1. 多轮聊天记忆

### 1.1 功能描述

AI 可以理解连续多轮对话，而不是孤立分析单条消息。

### 1.2 数据模型

\\\sql
CREATE TABLE chat_contexts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  contact_id BIGINT NOT NULL,
  message_index INT NOT NULL,        -- 消息序号
  user_message TEXT,                  -- 用户发送的消息
  boy_message TEXT,                   -- 男生的消息
  ai_reply TEXT,                      -- AI 建议的回复
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (openid) REFERENCES users(openid),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);
\\\

### 1.3 实现方案

- 前端维护对话上下文数组
- 每次分析时传入最近 N 条对话历史
- AI 根据上下文生成更符合情境的回复

\\\javascript
// 前端维护对话上下文
let conversationHistory = [
  { role: 'user', content: '上次我说...' },
  { role: 'assistant', content: '你可以这样回...' },
  { role: 'boy', content: '男生的最新消息' }
];

// 调用分析时带上上下文
wx.request({
  url: '/api/analysis/generate',
  data: {
    message: '男生的最新消息',
    history: conversationHistory.slice(-5)  // 最近 5 轮
  }
})
\\\

### 1.4 AI Prompt 调整

\\\
你是女性聊天军师。

当前对话上下文：
{conversation_history}

男生的最新消息：
{latest_message}

请结合上下文，给出更符合情境的回复建议。
\\\

---

## 2. AI 长期关系分析

### 2.1 功能描述

基于历史记录，提供关系发展趋势分析和建议。

### 2.2 分析维度

| 维度 | 说明 |
|------|------|
| 互动频率 | 谁主动更多 |
| 回复速度 | 平均响应时间 |
| 情感倾向 | 正面/中性/负面 |
| 进展评估 | 关系是否推进 |
| 建议 | 下一步行动建议 |

### 2.3 接口定义

**GET /api/analysis/trend**

请求参数：
\\\json
{
  \"contact_id\": 1,
  \"days\": 30    // 分析最近 N 天的数据
}
\\\

响应：
\\\json
{
  \"interaction_frequency\": {
    \"total_messages\": 120,
    \"user_sent\": 65,
    \"boy_sent\": 55,
    \"ratio\": \"1.18:1\"
  },
  \"response_time\": {
    \"average_minutes\": 15,
    \"trend\": \"increasing\"  // increasing/decreasing/stable
  },
  \"sentiment\": {
    \"positive\": 0.6,
    \"neutral\": 0.3,
    \"negative\": 0.1
  },
  \"progress\": \"关系稳步推进中\",
  \"suggestions\": [
    \"可以适当增加主动频率\",
    \"对方回复速度变快，是好迹象\",
    \"可以尝试邀约线下见面\"
  ]
}
\\\

---

## 3. 闺蜜群讨论模式

### 3.1 功能描述

邀请好友一起在小程序中讨论如何回复。

### 3.2 实现方案

- 生成分享链接/卡片
- 好友打开后可查看聊天内容
- 多人可以同时给出建议
- 所有者可以采纳最满意的回复

### 3.3 页面结构

\\\
闺蜜群讨论
├── 聊天内容预览
├── 人物卡信息
├── 好友建议列表
│   ├── 好友A 的建议
│   ├── 好友B 的建议
│   └── 好友C 的建议
├── 我的建议（已选）
└── 讨论区（可选）
\\\

---

## 4. 回复效果反馈

### 4.1 功能描述

用户对 AI 给出的回复进行评分，AI 根据反馈持续优化。

### 4.2 评分方式

\\\
[😢 没用]  [😐 一般]  [😊 不错]  [💕 超棒]
\\\

### 4.3 数据存储

\\\sql
CREATE TABLE reply_feedbacks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  contact_id BIGINT NOT NULL,
  reply_type VARCHAR(10) NOT NULL,  -- A/B/C
  rating INT NOT NULL,               -- 1-4
  comment TEXT,                      -- 选填备注
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\\\

### 4.4 AI 优化

- 收集用户评分高的回复模式
- 分析用户偏好的风格
- 逐步个性化推荐

---

## 5. 会员订阅

### 5.1 会员权益

| 权益 | 免费版 | 会员版 |
|------|--------|--------|
| 每日生成次数 | 3 次 | 无限 |
| AI 模型 | 标准 | 高级（GPT-4/Claude） |
| 回复风格 | 基础 9 种 | 全部 + 自定义 |
| 关系分析 | - | 高级趋势分析 |
| 广告 | 有 | 无 |

### 5.2 订阅流程

\\\
用户点击「开通会员」
  ↓
展示会员权益
  ↓
选择订阅周期（月/季/年）
  ↓
微信支付
  ↓
开通会员
  ↓
更新用户会员状态
\\\

### 5.3 数据库扩展

\\\sql
ALTER TABLE users ADD COLUMN (
  is_vip TINYINT DEFAULT 0,
  vip_expire_at DATETIME,
  vip_plan VARCHAR(20)            -- monthly/quarterly/yearly
);
\\\

---

## 6. 技术架构调整

### 6.1 新增模块

\\\
backend/src/modules/
├── chat-memory/     # 多轮对话记忆
├── subscription/    # 订阅管理
├── trend/           # 关系趋势分析
└── group/           # 闺蜜群讨论
\\\

### 6.2 数据库扩展

\\\sql
-- 新增表
chat_contexts        -- 对话上下文
reply_feedbacks      -- 回复反馈
subscriptions        -- 订阅记录
\\\

---

## 7. 验收检查清单

- [ ] AI 可以理解连续多轮对话
- [ ] 历史对话上下文正确传递
- [ ] 关系趋势分析功能正常
- [ ] 数据可视化展示清晰
- [ ] 闺蜜群讨论流程完整
- [ ] 回复效果评分功能可用
- [ ] 会员订阅流程正常
- [ ] 微信支付集成成功
- [ ] 会员权益正确生效

---

## 8. 注意事项

- 此阶段功能依赖 V1/V2 稳定运行
- 会员订阅需要接入微信支付
- 聊天记忆涉及更多数据存储，需注意隐私合规
- 闺蜜群讨论可能需要WebSocket支持
- 长期关系分析需要足够的历史数据
