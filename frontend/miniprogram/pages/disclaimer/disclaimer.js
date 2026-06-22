// pages/disclaimer/disclaimer.js
Page({
  data: {},

  onLoad() {
    // 保留作为备用入口，实际从 profile 弹窗打开
  },

  accept() {
    wx.setStorageSync('disclaimer_accepted', 1)
    wx.navigateBack()
  }
})
