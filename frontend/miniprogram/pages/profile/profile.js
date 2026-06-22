// pages/profile/profile.js
Page({
  data: {
    usedToday: 0,
    remaining: 3,
    showDisclaimer: false,
    showAgreement: false,
    showPrivacy: false,
    showClearDataModal: false,
    menuItems: [
      { icon: '📖', title: '使用说明', url: '/pages/usage/usage' },
      { icon: '🛡', title: '免责声明', type: 'modal' },
      { icon: '📄', title: '用户协议', type: 'modal' },
      { icon: '🔒', title: '隐私政策', type: 'modal' }
    ],
    manageItems: [
      { icon: '💾', title: '清空所有数据', url: '' },
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
    this.showToast('广告功能待接入')
  },

  onMenuTap(e) {
    const dataset = e.currentTarget.dataset
    const url = dataset.url
    const type = dataset.type

    // 免责声明和用户协议都走弹窗
    if (type === 'modal') {
      const title = dataset.title
      if (title === '免责声明') {
        this.setData({ showDisclaimer: true })
      } else if (title === '用户协议') {
        this.setData({ showAgreement: true })
      } else if (title === '隐私政策') {
        this.setData({ showPrivacy: true })
      }
      return
    }

    // 清空所有数据：弹出确认框
    if (url === '' && dataset.title === '清空所有数据') {
      this.setData({ showClearDataModal: true })
      return
    }

    if (url) {
      wx.navigateTo({ url })
    }
  },

  closeModal() {
    // 点击遮罩层不关闭
  },

  noop() {},

  acceptDisclaimer() {
    wx.setStorageSync('disclaimer_accepted', 1)
    this.setData({ showDisclaimer: false })
  },

  acceptAgreement() {
    wx.setStorageSync('agreement_accepted', 1)
    this.setData({ showAgreement: false })
  },

  acceptPrivacy() {
    wx.setStorageSync('privacy_accepted', 1)
    this.setData({ showPrivacy: false })
  },

  showToast(msg) {
    wx.showToast({ title: msg, icon: 'none' })
  },

  // ---- 清空数据弹窗 ----
  closeClearDataModal() {
    // 点击遮罩层不关闭
  },

  cancelClearData() {
    this.setData({ showClearDataModal: false })
  },

  confirmClearData() {
    var that = this
    // 清除人物卡
    wx.removeStorageSync('contacts')
    // 清除聊天记录
    wx.removeStorageSync('chatRecords')
    // 清除最近联系人
    wx.removeStorageSync('recentContacts')
    // 清除用户数据（重置计数）
    wx.removeStorageSync('user')
    // 清除缓存
    wx.clearStorageSync()
    // 重置页面上的统计数据
    this.setData({
      usedToday: 0,
      remaining: 3,
      showClearDataModal: false
    })
    wx.showToast({
      title: '数据已清空',
      icon: 'success',
      duration: 2000
    })
  }
})
