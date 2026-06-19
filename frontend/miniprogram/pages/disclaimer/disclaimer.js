// pages/disclaimer/disclaimer.js
Page({
  data: {
    show: false
  },

  onLoad() {
    this.checkAndShow()
  },

  checkAndShow() {
    const accepted = wx.getStorageSync('disclaimer_accepted')
    if (!accepted) {
      this.setData({ show: true })
    }
  },

  noop() {},

  accept() {
    wx.setStorageSync('disclaimer_accepted', 1)
    this.setData({ show: false })
    // 关闭弹窗后继续
    wx.navigateBack()
  }
})