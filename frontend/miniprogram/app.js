// app.js
const config = require('./config/index')

App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    baseUrl: config.baseUrl  // 使用配置文件中的 baseUrl
  },

  onLaunch() {
    try {
      // 自动登录
      this.autoLogin()
      // 清理过期的本地数据
      this.cleanExpiredData()
    } catch (e) {
      console.log('[App] onLaunch error (ignored):', e)
    }
  },

  autoLogin() {
    try {
      const token = wx.getStorageSync('token')
      if (token) {
        this.globalData.token = token
        // 验证 token 有效性
        this.validateToken(token)
      } else {
        // 没有 token，自动登录
        this.login()
      }
    } catch (e) {
      console.log('[App] autoLogin error (ignored):', e)
    }
  },

  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: `${this.globalData.baseUrl}/auth/login`,
              method: 'POST',
              data: { code: res.code },
              timeout: 10000,
              success: (result) => {
                if (result.data && result.data.success) {
                  const { token, user } = result.data.data
                  this.globalData.token = token
                  this.globalData.openid = user.openid
                  wx.setStorageSync('token', token)
                  wx.setStorageSync('user', JSON.stringify(user))
                  resolve(result.data.data)
                } else {
                  reject(new Error(result.data && result.data.message ? result.data.message : '登录失败'))
                }
              },
              fail: (err) => {
                reject(err)
              }
            })
          } else {
            reject(new Error('wx.login 获取 code 失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  validateToken(token) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/validate`,
      method: 'GET',
      timeout: 5000,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (!res.data.success) {
          // Token 失效，清除本地存储
          wx.removeStorageSync('token')
        }
      },
      fail: () => {
        // API 不可用时静默忽略
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
