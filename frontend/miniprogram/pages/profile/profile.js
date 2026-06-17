// pages/profile/profile.js
Page({
  data: {
    usedToday: 0,
    remaining: 3,
    menuItems: [
      { icon: '📖', title: '使用说明', url: '/pages/usage/usage' },
      { icon: '🛡', title: '免责声明', url: '/pages/disclaimer/disclaimer' },
      { icon: '📄', title: '用户协议', url: '/pages/agreement/agreement' },
      { icon: '🔒', title: '隐私政策', url: '/pages/privacy/privacy' }
    ],
    manageItems: [
      { icon: '💾', title: '数据管理', url: '' },
      { icon: '💬', title: '意见反馈', url: '/pages/feedback/feedback' },
      { icon: 'ℹ️', title: '关于我们', url: '/pages/about/about' }
    ]
  },

  onLoad() {
    this.loadData()
  },

  loadData() {
    const user = wx.getStorageSync('user')
    if (user) {
      const userData = JSON.parse(user)
      this.setData({
        usedToday: userData.used_today || 0,
        remaining: userData.free_count || 3
      })
    }
  },

  goToAdReward() {
    // TODO: 激励广告
    this.showToast('广告功能待接入')
  },

  onMenuTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url })
    }
  },

  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  }
})
