# Skill: V2 增强功能

## 阶段目标

在 MVP 基础上增加增强功能：

- OCR 截图识别
- 分享海报
- 数据管理
- 意见反馈

## 开发顺序

1. **OCR 功能** - 上传图片、客户端压缩、OCR 识别、回填文本
2. **分享海报** - 生成分析结果分享海报、微信分享
3. **数据管理** - 删除联系人、清除缓存、删除全部数据
4. **意见反馈** - 提交文本、截图、联系方式
5. **个人中心完善** - 使用说明、用户协议、隐私政策、关于我们

## 产出文件

### 前端新增

- \rontend/miniprogram/pages/index/ocr.wxml\ - OCR 上传组件
- \rontend/miniprogram/pages/feedback/\ - 意见反馈页
- \rontend/miniprogram/pages/agreement/\ - 用户协议
- \rontend/miniprogram/pages/privacy/\ - 隐私政策
- \rontend/miniprogram/pages/about/\ - 关于我们
- \rontend/miniprogram/pages/usage/\ - 使用说明
- \rontend/miniprogram/components/share-poster/\ - 分享海报组件
- \rontend/miniprogram/utils/ocr.js\ - OCR 工具
- \rontend/miniprogram/utils/compress.js\ - 图片压缩工具

### 后端新增

- \ackend/src/modules/ocr/\ - OCR 服务模块
- \ackend/src/modules/feedback/\ - 意见反馈模块

## 验收标准

- [ ] 用户可以上传聊天截图，OCR 自动识别填入文本框
- [ ] 上传前客户端压缩图片，单图不超过 2MB
- [ ] OCR 失败允许手动修正
- [ ] 可以生成分析结果分享海报
- [ ] 支持微信分享
- [ ] 用户可以在个人中心管理数据（删除联系人、清除缓存）
- [ ] 用户可以提交反馈意见
- [ ] 个人中心包含使用说明、用户协议、隐私政策、关于我们

## 注意事项

- OCR 按量计费，需要控制成本
- 分享海报需要Canvas绘制
- 数据管理要同时清理本地 Storage
