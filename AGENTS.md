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

### ⚠️ 避免 OpenAI BadRequestError（JSON 双重序列化）

**报错特征：** `Expecting property name enclosed in double quotes: line 1 column 2 (char 1)`

**根本原因：** 发送给 OpenAI API 的请求参数中，某个值被错误地进行了双重 JSON 序列化，导致 API 收到的是一个字符串而非合法的 JSON 对象。

**规避方法：**

1. **禁止对对象使用 `JSON.stringify` 后再传入 SDK 参数。** 如果需要使用 `extra_body` 或自定义字段，直接传递对象：

```typescript
// ❌ 错误：value 被转成了字符串
extra_body: {
  custom_param: JSON.stringify({ key: "value" })
}

// ✅ 正确：直接传对象
extra_body: {
  custom_param: { key: "value" }
}
```

2. **检查 `messages` 数组中的 `content` 字段。** 确保内容是字符串类型，不要传入已序列化的 JSON 字符串。

3. **调试技巧：** 在调用 OpenAI SDK 之前，用 `console.log` 打印完整的请求参数，确认所有嵌套对象都是 JavaScript 对象而非字符串。

4. **统一网关层处理：** 后端 AI 调用应通过统一的网关服务封装，避免在各业务模块中重复构造请求参数。

--------------------

### ****

1. ****定位序列化点**：** 搜索代码中所有 `JSON.stringify` 调用，尤其关注传给 AI SDK 的参数。
2. ****检查 `typeof` 类型**：** 在发送请求前，用 `console.log(typeof value)` 确认值不是 `string` 类型的 JSON。
3. ****打印原始请求体**：** 在 HTTP 层拦截请求，打印实际发送的内容，确认没有多余的引号包裹。

--------------------

### ****

- 将数据库查询结果直接传入 AI 消息时未做处理
- 模板字符串拼接 JSON 后再次 stringify
- 从 Redis/缓存读取的 JSON 字符串未 parse 就重新 stringify
- 中间件或拦截器对响应做了二次序列化

--------------------

### ****

- 封装统一的 `buildAiPayload()` 函数，集中处理参数构造
- 在网关层增加类型断言：`if (typeof content === "string") { JSON.parse(content) }`
- 单元测试覆盖边界情况：空对象、嵌套数组、特殊字符等
- 启用 NestJS 的 `interceptors` 打印最终请求体用于调试


---

## 经验教训：OpenAI BadRequestError 排查总结

### 一、报错现象

```
***.BadRequestError: OpenAIException - {
  "error": {
    "message": "Expecting property name enclosed in double quotes: line 1 column 2 (char 1)",
    "type": "BadRequestError",
    "param": null,
    "code": 400
  }
}
```

### 二、根本原因

发送给 OpenAI API 的请求参数中，某个值被错误地进行了**双重 JSON 序列化**（double serialization），导致 API 收到的不是一个合法的 JSON 对象，而是一个被额外引号包裹的字符串。

例如：
- 期望收到：`{"role": "user", "content": "你好"}`
- 实际收到：`"{\"role\": \"user\", \"content\": \"你好\"}"`（字符串而非对象）

### 三、常见触发场景

| 场景 | 说明 | 示例 |
|------|------|------|
| **1. 对对象再次 stringify** | 已经是 JSON 字符串的值，又被 `JSON.stringify` 包装一次 | `JSON.stringify(JSON.stringify(obj))` |
| **2. 模板字符串拼接后 stringify** | 用模板字符串拼出 JSON 字符串，再调用 `JSON.stringify` | `JSON.stringify(\`${jsonStr}\`)` |
| **3. 数据库/缓存结果未 parse 直接传入** | 从数据库或 Redis 读取的 JSON 字符串直接作为 content 传入 | 未执行 `JSON.parse()` |
| **4. 拦截器/中间件二次序列化** | NestJS 拦截器对已序列化的响应体再次处理 | `res.json(res.json(data))` |
| **5. messages.content 类型错误** | content 字段传入了对象而非字符串 | `"content": { "text": "xxx" }` 应为 `"content": "xxx"` |

### 四、排查步骤

#### Step 1：定位序列化点

```powershell
# 在项目中搜索所有 JSON.stringify 调用
rg "JSON\.stringify" backend/src/
```

重点关注：
- 传给 OpenAI SDK 的参数
- `messages` 数组中的 `content` 字段
- `extra_body` 自定义参数

#### Step 2：检查 typeof 类型

```typescript
// 在发送请求前添加调试日志
console.log('content type:', typeof content);
console.log('content value:', content);

// 如果 content 应该是字符串但实际是对象，或者反之，说明有问题
if (typeof content === 'string') {
  // 尝试解析看是否是双重序列化
  try {
    const parsed = JSON.parse(content);
    console.log('可能是双重序列化，原始值:', parsed);
  } catch (e) {
    // 正常的 JSON 字符串
  }
}
```

#### Step 3：拦截 HTTP 请求

使用 NestJS 的 `HttpInterceptor` 打印最终发送的请求体：

```typescript
@Injectable()
class AiRequestInterceptor implements NestInterceptor {
  intercept(context, observable) {
    return observable.pipe(
      tap((response) => {
        console.log('[AI Request] Response:', JSON.stringify(response, null, 2));
      })
    );
  }
}
```

#### Step 4：检查 SDK 版本兼容性

```typescript
// 不同版本的 OpenAI SDK 参数格式可能不同
// 确保使用的是官方推荐的参数格式
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 正确写法：messages.content 是字符串
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: '你好' }],
});

// 错误写法：content 是对象
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: { text: '你好' } }],
});
```

### 五、修复方案

#### 方案 1：封装统一的 buildAiPayload 函数

```typescript
interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildAiPayload(model, messages, extraParams) {
  // 确保所有 content 都是字符串类型
  const sanitizedMessages = messages.map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content),
  }));

  return {
    model,
    messages: sanitizedMessages,
    ...extraParams,
  };
}
```

#### 方案 2：在网关层增加类型断言

```typescript
function sanitizeContent(input) {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === 'object') {
        return input;
      }
    } catch {
      // 不是合法 JSON，直接返回
    }
    return input;
  }
  return JSON.stringify(input);
}
```

#### 方案 3：使用 TypeScript 类型约束

```typescript
interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
}

const request: ChatCompletionRequest = {
  model: 'gpt-4',
  messages: [
    { role: 'user', content: '你好' },
  ],
};
```

### 六、预防措施

1. **统一网关封装**：所有 AI 调用必须通过统一的网关服务，禁止在业务模块中直接构造请求参数
2. **类型约束**：使用 TypeScript 严格模式，定义清晰的接口类型
3. **单元测试**：覆盖边界情况（空对象、嵌套数组、特殊字符等）
4. **日志记录**：在 AI 调用前后记录请求体和响应体，便于排查问题
5. **代码审查**：涉及 `JSON.stringify` 的地方必须经过代码审查

### 七、快速自查清单

- [ ] 搜索项目中所有 `JSON.stringify` 调用，确认没有对对象双重序列化
- [ ] 检查 `messages.content` 字段是否都是字符串类型
- [ ] 确认从数据库/缓存读取的数据在使用前已正确 parse
- [ ] 检查 NestJS 拦截器是否对响应做了额外的序列化
- [ ] 使用 `typeof` 确认传入 SDK 的参数类型正确
- [ ] 开启 TypeScript 严格模式，利用类型系统提前发现问题