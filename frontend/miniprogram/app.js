// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    baseUrl: 'https://your-api-domain.com/api'  // TODO: 替换为实际域名
  },

  onLaunch() {
    // 自动登录
    this.autoLogin()
    // 清理过期的本地数据
    this.cleanExpiredData()
  },

  autoLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      // 验证 token 有效性
      this.validateToken(token)
    } else {
      this.login()
    }
  },

  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${this.globalData.baseUrl}/auth/login`,
            method: 'POST',
            data: { code: res.code },
            success: (result) => {
              if (result.data.success) {
                const { token, user } = result.data.data
                this.globalData.token = token
                this.globalData.openid = user.openid
                wx.setStorageSync('token', token)
                wx.setStorageSync('user', JSON.stringify(user))
              }
            }
          })
        }
      }
    })
  },

  validateToken(token) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/validate`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (!res.data.success) {
          // Token 失效，重新登录
          wx.removeStorageSync('token')
          this.login()
        }
      }
    })
  },

  cleanExpiredData() {
    // 清理超过 7 天的聊天记录
    const records = wx.getStorageSync('chat_records') || []
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const valid = records.filter(r => now - r.timestamp < sevenDays)
    wx.setStorageSync('chat_records', valid)
  }
})
