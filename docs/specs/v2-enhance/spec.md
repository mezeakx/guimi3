# V2 增强功能 Spec

## 概述

本文档定义「闺蜜代回复」第二阶段（增强功能）的详细开发规格。

**目标：** 在 MVP 基础上提升用户体验
**优先级：** P1 增强功能

---

## 1. OCR 截图识别

### 1.1 功能流程

\\\
用户切换到「上传截图」Tab
  ↓
点击「上传截图」按钮
  ↓
选择相册图片 / 拍照
  ↓
客户端压缩图片（最大 2MB）
  ↓
调用 OCR 接口
  ↓
回填文本框
  ↓
用户确认/修正
\\\

### 1.2 图片压缩

使用小程序 Canvas 压缩：
\\\javascript
function compressImage(filePath, maxWidth = 1200, quality = 80) {
  return new Promise((resolve, reject) => {
    const systemInfo = wx.getSystemInfoSync();
    const canvasWidth = Math.min(maxWidth, systemInfo.windowWidth * 2);
    const ctx = wx.createCanvasContext('ocr-compress');
    // 加载图片、压缩、导出
    ctx.drawImage(filePath, 0, 0, canvasWidth, canvasHeight);
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'ocr-compress',
        quality: quality / 100,
        success: (res) => resolve(res.tempFilePath)
      })
    })
  })
}
\\\

### 1.3 OCR 接口

**POST /api/ocr/recognize**

请求：
- 文件：上传图片（multipart/form-data）
- 限制：单图最大 2MB

响应：
\\\json
{
  \"text\": \"识别出的文本内容\",
  \"confidence\": 0.95
}
\\\

### 1.4 成本控制

- 优先鼓励用户复制文本
- 客户端压缩减少传输成本
- Redis 限流：每日最多 10 次 OCR
- OCR 失败允许手动修正

### 1.5 Redis 设计

\\\
Key: ocr:{task_id}
Value: OCR 结果
TTL: 300 秒

Key: ocr_limit:{openid}
Value: 今日 OCR 使用次数
TTL: 24 小时
Max: 10 次
\\\

---

## 2. 分享海报

### 2.1 海报内容

\\\
┌─────────────────────┐
│    闺蜜代回复 💕    │
│                     │
│  消息分析结果        │
│                     │
│  回复建议1          │
│  回复建议2          │
│  回复建议3          │
│                     │
│  AI 生成，仅供参考   │
│                     │
│  [小程序码]         │
│  扫码获取回复建议    │
└─────────────────────┘
\\\

### 2.2 实现方案

使用 Canvas 绘制海报：
\\\javascript
function createSharePoster(result, callback) {
  const ctx = wx.createCanvasContext('share-poster');
  // 绘制背景、文字、小程序码
  ctx.draw(false, () => {
    wx.canvasToTempFilePath({
      canvasId: 'share-poster',
      success: (res) => callback(res.tempFilePath)
    })
  })
}
\\\

### 2.3 分享流程

\\\
用户点击「分享给闺蜜」
  ↓
生成海报（Canvas 绘制）
  ↓
wx.shareAppMessage
  ↓
用户选择分享对象
\\\

---

## 3. 数据管理

### 3.1 功能清单

| 功能 | 本地操作 | 服务端操作 |
|------|---------|-----------|
| 删除联系人 | - | DELETE /api/contact/delete |
| 清除缓存 | 清除临时文件 | - |
| 删除全部数据 | 清除 Storage | DELETE /api/user/clear-all |

### 3.2 本地存储清理

\\\javascript
function clearLocalData() {
  // 清除人物卡（用户主动删除才移除）
  // 清除聊天记录（7 天自动过期）
  // 清除临时文件
  wx.clearStorageSync()
}
\\\

### 3.3 7 天自动清理

进入小程序时检查：
\\\javascript
// 检查聊天记录是否超过 7 天
function cleanExpiredRecords() {
  const records = wx.getStorageSync('chat_records') || []
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const valid = records.filter(r => now - r.timestamp < sevenDays)
  wx.setStorageSync('chat_records', valid)
}
\\\

---

## 4. 意见反馈

### 4.1 接口定义

**POST /api/feedback/submit**

请求体：
\\\json
{
  \"content\": \"反馈文本内容\",
  \"images\": [\"url1\", \"url2\"],  // 选填
  \"contact\": \"联系方式（选填）\"
}
\\\

响应：
\\\json
{
  \"success\": true,
  \"message\": \"反馈提交成功，感谢你的建议！\"
}
\\\

### 4.2 前端页面

\\\
意见反馈
├── 反馈类型选择
├── 文本输入框（必填）
├── 截图上传（选填，最多 3 张）
├── 联系方式（选填）
└── 提交按钮
\\\

---

## 5. 个人中心完善

### 5.1 页面结构

\\\
我的
├── 用户信息卡片
│   ├── 头像（默认）
│   ├── 今日已用次数
│   ├── 剩余免费次数
│   └── 广告奖励按钮
├── 服务
│   ├── 使用说明
│   ├── 免责声明
│   ├── 用户协议
│   └── 隐私政策
├── 管理
│   ├── 数据管理
│   ├── 意见反馈
│   └── 关于我们
\\\

### 5.2 使用说明页面

\\\
闺蜜代回复使用说明

📌 产品定位
- 聊天建议工具
- 非自动回复工具
- 非恋爱成功工具

📌 使用方法
1. 新建联系人，设置身份和目标
2. 在首页输入他的消息
3. 可选：填写前情提要
4. 点击「生成回复建议」
5. 选择喜欢的回复复制发送

📌 注意事项
- AI 结果仅供参考
- 请结合实际情况判断
- 不是情感咨询服务
\\\

### 5.3 用户协议 & 隐私政策

- 独立页面展示
- 使用 WebView 或富文本渲染
- 符合微信小程序合规要求

---

## 6. 接口汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ocr/recognize | OCR 识别 |
| POST | /api/feedback/submit | 提交反馈 |
| DELETE | /api/contact/delete | 删除联系人 |
| DELETE | /api/user/clear-all | 清除全部数据 |
| POST | /api/ad/reward | 广告奖励 |

---

## 7. 验收检查清单

- [ ] OCR 截图识别正常工作
- [ ] 上传前客户端压缩图片
- [ ] 单图不超过 2MB
- [ ] OCR 失败允许手动修正
- [ ] 每日 OCR 限流 10 次
- [ ] 分享海报生成正常
- [ ] 可以微信分享
- [ ] 数据管理功能完整
- [ ] 7 天自动清理生效
- [ ] 意见反馈提交成功
- [ ] 个人中心所有页面完善
- [ ] 使用说明内容准确
