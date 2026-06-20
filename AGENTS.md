# 闺蜜代回复 - Agent 指南

## 项目概述

「闺蜜代回复」是一款微信小程序，帮助女生快速获取高情商聊天回复建议。
本项目为聊天建议工具，非自动回复工具或情感咨询服务。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生（WXML / WXSS / JavaScript） |
| 后端 | Node.js + NestJS + MySQL + Redis |
| AI | DeepSeek / OpenAI / Claude（统一网关） |
| OCR | 腾讯云 OCR / 微信 OCR |
| 存储 | 腾讯云 COS（截图）、MySQL（业务数据）、Redis（缓存） |
| 本地 | 微信 Storage（人物卡、聊天记录） |

## 目录结构

\\\
guimi3/
├── frontend/miniprogram/       # 微信小程序前端
│   ├── pages/                  # 页面
│   │   ├── index/              # 首页
│   │   ├── result/             # 分析结果页
│   │   ├── contacts/           # 联系人列表
│   │   ├── contact-create/     # 新建联系人
│   │   ├── contact-detail/     # 联系人详情
│   │   ├── profile/            # 我的
│   │   ├── feedback/           # 意见反馈
│   │   ├── agreement/          # 用户协议
│   │   ├── privacy/            # 隐私政策
│   │   ├── disclaimer/         # 免责声明
│   │   ├── about/              # 关于我们
│   │   └── usage/              # 使用说明
│   ├── components/             # 自定义组件
│   ├── utils/                  # 工具函数
│   ├── api/                    # API 请求封装
│   ├── config/                 # 配置文件
│   ├── styles/                 # 全局样式
│   ├── assets/                 # 静态资源
│   ├── app.js                  # 应用入口
│   ├── app.json                # 应用配置
│   ├── app.wxss                # 全局样式
│   └── sitemap.json
├── backend/src/                # NestJS 后端
│   ├── modules/                # 业务模块
│   │   ├── auth/               # 登录认证
│   │   ├── contact/            # 联系人管理
│   │   ├── analysis/           # AI 分析
│   │   ├── feedback/           # 意见反馈
│   │   ├── ad/                 # 广告管理
│   │   ├── ocr/                # OCR 服务
│   │   └── user/               # 用户管理
│   ├── common/                 # 公共模块
│   │   ├── guards/             # 守卫
│   │   ├── interceptors/       # 拦截器
│   │   ├── filters/            # 异常过滤器
│   │   └── decorators/         # 装饰器
│   ├── config/                 # 配置
│   └── main.ts                 # 入口
├── backend/prisma/             # 数据库 Schema
├── docs/specs/                 # 需求文档
│   ├── v1-mvp/                 # 第一阶段 MVP
│   ├── v2-enhance/             # 第二阶段增强
│   └── v3-advanced/            # 第三阶段高级功能
└── skills/                     # Agent Skill 定义
\\\

## 核心设计原则

1. **不是替用户谈恋爱** - 而是帮助用户更好表达
2. **不是操控关系** - 而是降低沟通成本
3. **不是保证结果** - 而是提供参考建议

## 隐私与数据策略

- 聊天内容默认不保存，分析结束后立即删除
- 人物卡默认永久保存在用户本地 Storage
- 聊天记录本地保留 7 天后自动删除
- 服务端默认不保存聊天内容

## 内容安全

- 用户输入需经过 \msgSecCheck\ 审核
- AI 输出需经过 \msgSecCheck\ 审核
- 禁止出现 PUA、情感操控等违规词汇
- 统一描述为：聊天建议、沟通辅助、回复参考

## 可用 Skill

本项目的开发由以下 Skill 驱动，每个 Skill 对应一个开发阶段：

| Skill | 阶段 | 描述 | 文件路径 |
|-------|------|------|----------|
| \1-mvp\ | 第一阶段 | 核心功能上线 | \skills/v1-mvp.skill.md\ |
| \2-enhance\ | 第二阶段 | 增强功能 | \skills/v2-enhance.skill.md\ |
| \3-advanced\ | 第三阶段 | 高级功能 | \skills/v3-advanced.skill.md\ |

使用时请明确指定 Skill 名称，例如："\Skill: v1-mvp\ 实现首页功能"。

## 文件编码规范

### ⚠️ 微信小程序 JSON 文件必须使用 UTF-8 无 BOM 编码

**常见错误：** 微信开发者工具报错 `Unexpected token in JSON at position 0`

**原因：** 文件被写入了 UTF-8 BOM（字节序标记，十六进制 `EF BB BF`），微信小程序不识别此标记。

**预防措施：**
- 使用 PowerShell 写入 JSON 文件时，务必使用 `[System.Text.UTF8Encoding]::new($false)` 禁用 BOM
- 使用 Node.js 写入时，确保 `writeFileSync` 不自动添加 BOM
- 写入后检查文件前三个字节是否为 `EF BB BF`，如果是则需去除

**排查命令：**
- PowerShell: 读取文件头查看前几个字节
- Node.js: 读取文件头 3 字节判断 `0xEF 0xBB 0xBF`

## 编码规范

### 前端

- 使用微信小程序原生框架
- 样式遵循粉色系主题（主色 \#FF69B4\，渐变 \#FF69B4 -> #9B59B6\）
- 组件化开发，公共组件放入 \components/\
- 所有 API 请求通过 \pi/\ 目录统一封装
- 使用 \wx.request\ 发起 HTTP 请求，统一处理错误和 loading

### 后端

- 遵循 NestJS 模块化架构
- 使用 Prisma 进行数据库操作
- 使用 Redis 做缓存和限流
- AI 调用通过统一网关，支持多模型切换
- 所有内容安全审核通过后才能返回给用户

### 命名规范

- 前端页面：kebab-case（如 \contact-create\）
- 后端模块：camelCase（如 \ContactModule\）
- 数据库字段：snake_case（如 \created_at\）
- API 路径：kebab-case（如 \/api/contact-list\）

## 开发流程

1. 阅读 \docs/specs/\ 下的对应阶段 Spec 文件
2. 根据 Skill 文件中的指引进行开发
3. 完成后更新 Spec 文件的完成状态
4. 确保代码符合编码规范和隐私安全要求


## AI 调用规范

### 核心规则：所有 AI 请求必须通过统一网关

所有 AI 模型调用（DeepSeek / OpenAI / Claude）必须通过统一的 AI 网关服务，禁止在业务模块中直接构造 HTTP 请求。

### 1. 禁止 JSON 双重序列化

严禁对对象使用 JSON.stringify 后再传入 SDK 参数。

```typescript
// 错误：value 被转成了字符串
extra_body: {
  custom_param: JSON.stringify({ key: "value" })
}

// 正确：直接传对象
extra_body: {
  custom_param: { key: "value" }
}
```

### 2. messages.content 必须是字符串

```typescript
// 正确：content 是字符串
messages: [{ role: "user", content: "你好" }]

// 错误：content 是对象
messages: [{ role: "user", content: { text: "你好" } }]
```

### 3. 模板字符串拼接用户输入时必须转义

构建系统提示词时，用户输入可能包含引号、换行等破坏 JSON 格式的字符：

```typescript
private escapeTemplateValue(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/\/g, "\\")
    .replace(/"/g, "\"")
    .replace(/
/g, "\n")
    .replace(//g, "\r")
    .replace(/	/g, "\t");
}
```

### 4. 从数据库/缓存读取的 JSON 字符串必须先 parse

```typescript
// 错误：Redis 取出的字符串直接传入
const cachedData = await this.redis.get(key);
messages.push({ role: "user", content: cachedData });

// 正确：先 parse 再使用
const cachedData = JSON.parse(await this.redis.get(key));
messages.push({ role: "user", content: String(cachedData) });
```

### 5. 发送前验证请求体合法性

```typescript
const requestBody = { model, messages, ...params };
JSON.stringify(requestBody);
messages.forEach(m => {
  if (typeof m.content !== "string") {
    m.content = String(m.content);
  }
});
```

### 6. 使用 TypeScript 类型约束

```typescript
interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiRequest {
  model: string;
  messages: AiMessage[];
  temperature?: number;
  max_tokens?: number;
}
```

### 7. 错误处理与日志

```typescript
try {
  const response = await axios.post(url, requestBody, config);
  return response.data;
} catch (error) {
  if (error.response?.data?.error) {
    this.logger.error("AI API 错误:", error.response.data.error);
  }
  return this.getFallbackResult();
}
```

### 快速自查清单

- [ ] 搜索项目中所有 JSON.stringify 调用，确认没有对对象双重序列化
- [ ] 检查 messages.content 字段是否都是字符串类型
- [ ] 确认从数据库/缓存读取的数据在使用前已正确 parse
- [ ] 检查 NestJS 拦截器是否对响应做了额外的序列化
- [ ] 使用 typeof 确认传入 SDK 的参数类型正确
- [ ] 开启 TypeScript 严格模式，利用类型系统提前发现问题
