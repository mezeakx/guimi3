// pages/index/index.js
const api = require('../../utils/http')
const config = require('../../config/index')
const { countChars, showToast, showLoading, hideLoading, isEmpty } = require('../../utils/helpers')

Page({
  data: {
    inputMode: 'text',
    message: '',
    context: '',
    charCount: 0,
    contextCount: 0,
    maxMessage: config.maxMessageLength,
    maxContext: config.maxContextLength,
    remainingCount: 3,
    recentContacts: [],
    generating: false
  },

  onLoad() {
    this.loadRemainingCount()
    this.loadRecentContacts()
  },

  onShow() {
    // 每次切回首页时刷新最近联系人
    this.loadRecentContacts()
  },

  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ inputMode: mode })
  },

  onMessageInput(e) {
    const value = e.detail.value
    const count = countChars(value)
    if (count <= this.data.maxMessage) {
      this.setData({ message: value, charCount: count })
    }
  },

  onContextInput(e) {
    const value = e.detail.value
    const count = countChars(value)
    if (count <= this.data.maxContext) {
      this.setData({ context: value, contextCount: count })
    }
  },

  loadRemainingCount() {
    const user = wx.getStorageSync('user')
    if (user) {
      const userData = JSON.parse(user)
      this.setData({ remainingCount: userData.free_count || 3 })
    }
  },

  loadRecentContacts() {
    const contacts = wx.getStorageSync('recent_contacts') || []
    this.setData({ recentContacts: contacts.slice(0, 4) })
  },

  onContactSelect(e) {
    const contact = e.currentTarget.dataset.contact
    this.setData({ message: '', context: '' })
    wx.setStorageSync('last_contact', JSON.stringify(contact))
    showToast('已选择 ' + contact.nickname)
  },

  uploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.handleOCR(res.tempFilePaths[0])
      }
    })
  },

  handleOCR(filePath) {
    showLoading('识别中...')
    setTimeout(() => {
      hideLoading()
      showToast('OCR 功能待接入')
    }, 1000)
  },

  async generateReply() {
    if (isEmpty(this.data.message)) {
      showToast('请输入他的消息')
      return
    }
    if (this.data.remainingCount <= 0) {
      showToast('今日次数已用完，观看广告获取更多')
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })
    showLoading('分析中...')

    try {
      const lastContact = wx.getStorageSync('last_contact')
      const contact = lastContact ? JSON.parse(lastContact) : {}

      const result = await api.post('/analysis/generate', {
        message: this.data.message,
        context: this.data.context,
        contact_id: contact.id || null,
        identity: contact.identity || '',
        target: contact.target || '',
        style: contact.style || ''
      })

      hideLoading()

      const newCount = this.data.remainingCount - 1
      this.setData({ remainingCount: newCount })

      wx.navigateTo({
        url: '/pages/result/result?data=' + encodeURIComponent(JSON.stringify(result.data))
      })
    } catch (err) {
      hideLoading()
      showToast('系统繁忙，请稍后再试')
      console.error('生成回复失败:', err)
    } finally {
      this.setData({ generating: false })
    }
  }
})