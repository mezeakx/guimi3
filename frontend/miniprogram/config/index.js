// 配置文件
module.exports = {
  // API 基础地址（生产环境替换）
  baseUrl: 'http://localhost:3000/api',

  // 微信 AppID
  appId: 'your_wechat_appid',

  // 每日免费次数
  dailyFreeCount: 3,

  // 广告奖励上限
  maxRewardCount: 5,

  // 最大消息长度
  maxMessageLength: 500,

  // 最大前情提要长度
  maxContextLength: 100,

  // 聊天记录保留天数
  chatRecordRetentionDays: 7,

  // 单次 OCR 最大图片大小（字节）
  maxOcrImageSize: 2 * 1024 * 1024,

  // 每日 OCR 上限
  maxOcrPerDay: 10,

  // 颜色主题
  theme: {
    primary: '#FF69B4',
    gradientStart: '#FF69B4',
    gradientEnd: '#9B59B6',
    background: '#FFF5F8',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textPlaceholder: '#999999',
    border: '#EEEEEE'
  }
}
