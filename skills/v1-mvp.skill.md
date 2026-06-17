# Skill: V1 MVP 核心功能

## 阶段目标

在 1 周内完成 MVP 核心功能上线，包含：

- 微信登录
- 文本输入
- AI 生成回复
- 联系人系统
- 免费次数
- 激励广告
- 免责声明
- 内容审核

## 开发顺序

1. **项目初始化** - 前后端脚手架搭建
2. **微信登录** - OpenID 无感登录
3. **数据库设计** - Users、Contacts、Feedback 表
4. **联系人系统** - 新建、编辑、删除联系人
5. **首页** - 文本输入、前情提要、生成按钮
6. **AI 分析** - 调用 AI 生成回复建议
7. **结果页** - 展示推荐回复、男生意图、风险提醒
8. **次数管理** - 免费次数、激励广告
9. **免责声明** - 首次弹窗
10. **内容审核** - 输入输出安全审核

## 产出文件

### 前端

- \rontend/miniprogram/app.json\ - 应用配置（TabBar、页面路由）
- \rontend/miniprogram/pages/index/\ - 首页
- \rontend/miniprogram/pages/result/\ - 分析结果页
- \rontend/miniprogram/pages/contacts/\ - 联系人列表
- \rontend/miniprogram/pages/contact-create/\ - 新建联系人
- \rontend/miniprogram/pages/profile/\ - 我的
- \rontend/miniprogram/pages/disclaimer/\ - 免责声明弹窗
- \rontend/miniprogram/api/\ - API 请求封装
- \rontend/miniprogram/utils/\ - 工具函数
- \rontend/miniprogram/config/\ - 配置文件

### 后端

- \ackend/src/modules/auth/\ - 登录认证模块
- \ackend/src/modules/contact/\ - 联系人管理模块
- \ackend/src/modules/analysis/\ - AI 分析模块
- \ackend/src/modules/ad/\ - 广告管理模块
- \ackend/src/modules/user/\ - 用户管理模块
- \ackend/prisma/schema.prisma\ - 数据库 Schema
- \ackend/src/common/guards/\ - 守卫
- \ackend/src/common/interceptors/\ - 拦截器

## 验收标准

- [ ] 用户可以微信扫码登录
- [ ] 首页可以输入聊天内容并生成回复
- [ ] 可以新建联系人并设置身份、目标、风格
- [ ] AI 返回 3 条回复建议 + 意图分析 + 风险提醒
- [ ] 每日免费 3 次，看广告额外 +2 次（上限 5 次）
- [ ] 首次进入显示免责声明
- [ ] 所有输入输出经过内容审核
- [ ] 界面符合 UI 设计稿
