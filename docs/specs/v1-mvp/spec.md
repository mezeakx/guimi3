# V1 MVP 开发 Spec

## 概述

本文档定义「闺蜜代回复」微信小程序第一阶段（MVP）的详细开发规格。

**目标：** 1 周内完成核心功能上线
**优先级：** P0 必须上线

---

## 1. 微信登录

### 1.1 登录流程

\\\
用户打开小程序
  ↓
wx.login 获取 code
  ↓
code 发送给后端
  ↓
后端用 code 换 openid
  ↓
检查用户是否存在
  ↓
不存在则自动创建
  ↓
返回 token
  ↓
前端存储 token
\\\

### 1.2 接口定义

**POST /api/auth/login**

请求体：
\\\json
{
  \"code\": \"wx_login_code\"
}
\\\

响应：
\\\json
{
  \"token\": \"jwt_token\",
  \"user\": {
    \"id\": 1,
    \"openid\": \"openid_xxx\",
    \"free_count\": 3,
    \"disclaimer_accepted\": false
  }
}
\\\

### 1.3 前端实现

- 在 \pp.js\ 的 \onLaunch\ 中自动登录
- Token 存储在 \wx.setStorageSync('token', token)\
- 登录失败不影响使用（降级为匿名模式）

---

## 2. 数据库设计

### 2.1 Users 表

\\\sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) UNIQUE NOT NULL,
  free_count INT DEFAULT 3,          -- 每日免费次数
  reward_count INT DEFAULT 0,        -- 今日广告奖励次数
  disclaimer_accepted TINYINT DEFAULT 0,  -- 是否接受免责声明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
\\\

### 2.2 Contacts 表

\\\sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,       -- 绑定用户
  nickname VARCHAR(20) NOT NULL,     -- 联系人昵称
  avatar VARCHAR(255),               -- 头像 URL
  identity VARCHAR(20) NOT NULL,     -- 身份
  target VARCHAR(20) NOT NULL,       -- 回复目标
  style VARCHAR(20) NOT NULL,        -- 回复风格
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (openid) REFERENCES users(openid)
);
\\\

### 2.3 Feedback 表

\\\sql
CREATE TABLE feedback (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  images JSON,                       -- 截图 URL 数组
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\\\

---

## 3. 联系人系统

### 3.1 字段定义

**联系人身份（单选）：**

| 值 | 说明 |
|---|------|
| crush | 暗恋对象 |
| god | 男神 |
|暧昧 | 暧昧对象 |
| pursuer | 追求者 |
| blind_date | 相亲对象 |
| friend | 普通朋友 |
| classmate | 同学 |
| colleague | 同事 |
| boss | 上司 |
| client | 客户 |
| party_a | 甲方 |
| ex | 前任 |
| netizen | 网友 |
| game_partner | 游戏搭子 |
| unwanted | 想拒绝的人 |
| older | 年上 |
| younger | 年下 |

**回复目标（单选）：**

| 值 | 说明 |
|---|------|
|了解 | 先了解他 |
|flirt | 提升好感 |
|ambiguous | 保持暧昧 |
|proactive | 让他主动 |
|friend | 保持朋友 |
|reject | 委婉拒绝 |

**回复风格（单选）：**

| 值 | 说明 |
|---|------|
|gentle | 温柔 |
|humor | 幽默 |
|cold | 高冷 |
|cute | 可爱 |
|mature | 成熟姐姐 |
|rational | 理性 |
|casual | 自然随性 |
|flirt | 撩人 |
|tsundere | 傲娇 |

### 3.2 接口定义

**POST /api/contact/list**

获取联系人列表（按最近使用排序）

**POST /api/contact/create**

\\\json
{
  \"nickname\": \"阿杰\",
  \"identity\": \"crush\",
  \"target\": \"flirt\",
  \"style\": \"gentle\"
}
\\\

**POST /api/contact/delete**

\\\json
{
  \"contact_id\": 1
}
\\\

---

## 4. 首页功能

### 4.1 页面结构

\\\
首页
├── TabBar（首页高亮）
├── 输入方式切换（文字输入 / 上传截图）
├── 他的消息输入框（500字，实时字数统计）
├── 前情提要输入框（100字，选填）
├── 生成回复建议按钮
├── 最近联系人（横向滚动）
└── 免费次数展示（剩余 3 次）
\\\

### 4.2 交互逻辑

**输入方式切换：**

- 默认「文字输入」
- 切换到「上传截图」时显示上传按钮
- 上传后 OCR 识别回填文本框

**生成按钮：**

1. 校验「他的消息」不为空
2. 调用内容审核 \wx.cloud.callFunction(msgSecCheck)\
3. 审核通过后调用 AI 分析接口
4. 展示结果页

### 4.3 接口定义

**POST /api/analysis/generate**

请求体：
\\\json
{
  \"message\": \"男生消息内容\",
  \"context\": \"前情提要（选填）\",
  \"contact_id\": 1,              // 选填，来自最近联系人
  \"identity\": \"crush\",
  \"target\": \"flirt\",
  \"style\": \"gentle\"
}
\\\

响应：
\\\json
{
  \"reply_A\": \"回复建议一\",
  \"reply_B\": \"回复建议二\",
  \"reply_C\": \"回复建议三\",
  \"boy_intent\": \"男生意图分析\",
  \"risk_warning\": \"风险提醒\"
}
\\\

---

## 5. 分析结果页

### 5.1 页面结构

\\\
分析结果页
├── 推荐回复1 [复制]
├── 推荐回复2 [复制]
├── 推荐回复3 [复制]
├── 男生意图
├── 风险提醒
├── 分享给闺蜜 [按钮]
└── AI 生成，仅供参考
\\\

### 5.2 交互逻辑

**复制回复：**

- 点击 [复制] 按钮
- \wx.setClipboardData\ 复制到剪贴板
- 提示「复制成功」

**分享：**

- 点击 [分享给闺蜜]
- 生成分享海报（Canvas 绘制）
- 支持分享到朋友圈/发给朋友

---

## 6. 次数管理

### 6.1 规则

- 每日免费 3 次
- 看激励广告 +1 次，每日最多 5 次
- 免费次数用完后引导看广告

### 6.2 Redis 设计

\\\
Key: user:{openid}:free_count
Value: 剩余次数
TTL: 每日 0 点自动重置（Cron）

Key: user:{openid}:reward_count
Value: 今日广告奖励次数
TTL: 每日 0 点重置

Key: ocr_limit:{openid}
Value: 今日 OCR 使用次数
TTL: 24 小时

Key: reward:{openid}:{timestamp}
Value: 广告奖励记录
TTL: 7 天（防刷）
\\\

### 6.3 接口定义

**POST /api/ad/reward**

\\\json
{
  \"ad_id\": \"微信广告位ID\",
  \"ad_error\": \"\"   // 广告播放失败时传错误码
}
\\\

响应：
\\\json
{
  \"success\": true,
  \"remaining\": 4
}
\\\

---

## 7. 免责声明

### 7.1 触发条件

- 首次进入小程序时检查 \disclaimer_accepted\
- 如果为 0，弹出免责声明弹窗
- 用户点击「我知道啦」后设置为 1

### 7.2 弹窗内容

\\\
闺蜜代回复提供聊天建议和表达参考。

生成内容仅供用户自主判断和参考。

本产品不保证任何关系结果，
亦不对用户实际沟通行为产生的后果负责。

请理性使用，并结合实际情况进行判断。

[我知道啦]
\\\

### 7.3 结果页提示

页面底部固定显示：
\\\
以上内容由 AI 生成，仅供参考。
请结合实际情况自主判断。
\\\

灰色、小字号、弱化展示

---

## 8. 内容安全体系

### 8.1 用户输入审核

\\\
用户输入文本
  ↓
wx.cloud.callFunction(msgSecCheck)
  ↓
通过 → 发送给 AI
失败 → 提示「内容包含违规信息，请修改后重试」
\\\

### 8.2 AI 输出审核

\\\
AI 返回结果
  ↓
msgSecCheck 审核
  ↓
通过 → 展示给用户
失败 → 重新生成（最多 1 次）
\\\

### 8.3 AI Prompt

系统 Prompt：
\\\
你是一位成熟理性的女性聊天军师。

请根据以下信息提供回复建议：
1. 男生身份
2. 回复目标
3. 回复风格
4. 聊天内容
5. 前情提要

输出要求：
- 3 条回复建议（风格符合选择的回复风格）
- 男生的可能意图分析
- 风险提醒（当前关系阶段是否适合某些表达）

禁止：
- PUA 技巧
- 情感操控
- 虚假承诺
- 攻击性表达

统一返回 JSON 格式：
{
  \"reply_A\": \"...\",
  \"reply_B\": \"...\",
  \"reply_C\": \"...\",
  \"boy_intent\": \"...\",
  \"risk_warning\": \"...\"
}
\\\

---

## 9. AI 容错机制

### 9.1 Markdown 清洗

\\\javascript
content
  .replace(/\\\\\\\\\json/g, '')
  .replace(/\\\\\\\\\/g, '')
  .trim()
\\\

### 9.2 JSON 解析失败重试

\\\javascript
try {
  JSON.parse(result)
} catch (e) {
  retry()  // 最多重试 1 次
}
\\\

### 9.3 最终兜底

如果 AI 服务完全不可用：
\\\json
{
  \"reply_A\": \"哈哈刚看到消息～\",
  \"reply_B\": \"最近有点忙呢～\",
  \"reply_C\": \"谢谢你的消息～\",
  \"boy_intent\": \"暂时无法分析\",
  \"risk_warning\": \"系统繁忙，请稍后重试\"
}
\\\

### 9.4 原则

- 永远返回合法 JSON
- 永远不白屏
- 永远不崩溃
- 永远不无限 Loading

---

## 10. 前端页面路由

\\\json
{
  \"pages\": [
    \"pages/index/index\",
    \"pages/result/result\",
    \"pages/contacts/contacts\",
    \"pages/contact-create/contact-create\",
    \"pages/profile/profile\",
    \"pages/disclaimer/disclaimer\"
  ],
  \"tabBar\": {
    \"custom\": false,
    \"color\": \"#999999\",
    \"selectedColor\": \"#FF69B4\",
    \"backgroundColor\": \"#FFFFFF\",
    \"list\": [
      {
        \"pagePath\": \"pages/index/index\",
        \"text\": \"首页\",
        \"iconPath\": \"assets/icons/home.png\",
        \"selectedIconPath\": \"assets/icons/home-active.png\"
      },
      {
        \"pagePath\": \"pages/contacts/contacts\",
        \"text\": \"联系人\",
        \"iconPath\": \"assets/icons/contacts.png\",
        \"selectedIconPath\": \"assets/icons/contacts-active.png\"
      },
      {
        \"pagePath\": \"pages/profile/profile\",
        \"text\": \"我的\",
        \"iconPath\": \"assets/icons/profile.png\",
        \"selectedIconPath\": \"assets/icons/profile-active.png\"
      }
    ]
  }
}
\\\

---

## 11. UI 设计规范

### 11.1 色彩

| 用途 | 颜色 | 值 |
|------|------|-----|
| 主色 | 粉色 | \#FF69B4\ |
| 渐变起始 | 粉色 | \#FF69B4\ |
| 渐变结束 | 紫色 | \#9B59B6\ |
| 背景 | 浅粉 | \#FFF5F8\ |
| 文字主 | 深灰 | \#333333\ |
| 文字次 | 中灰 | \#666666\ |
| 文字提示 | 浅灰 | \#999999\ |
| 边框 | 浅灰 | \#EEEEEE\ |

### 11.2 圆角

- 卡片：\16rpx\
- 按钮：\40rpx\
- 输入框：\12rpx\

### 11.3 字体

- 标题：\36rpx\ 加粗
- 正文：\28rpx\
- 辅助文字：\24rpx\
- 小字：\22rpx\

---

## 12. 验收检查清单

- [ ] 用户可以微信扫码登录
- [ ] 首页可以输入聊天内容（500字限制）
- [ ] 前情提要输入框（100字限制）
- [ ] 生成回复按钮正常响应
- [ ] AI 返回 3 条回复 + 意图 + 风险
- [ ] 结果页可以复制回复
- [ ] 新建联系人功能完整
- [ ] 联系人身份/目标/风格选择正确
- [ ] 最近联系人点击自动带入人物卡
- [ ] 每日免费 3 次
- [ ] 激励广告 +1 次（上限 5 次）
- [ ] 首次进入显示免责声明
- [ ] 内容审核正常工作
- [ ] AI 容错机制有效
- [ ] 界面符合 UI 设计稿
- [ ] 所有页面响应式适配
