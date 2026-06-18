// pages/index/index.js
const api = require('../../utils/http')
const { processContactsAvatars } = require('../../utils/identity-avatar')
const config = require('../../config/index')
const { countChars, showLoading, hideLoading, isEmpty } = require('../../utils/helpers')

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
    const contacts = wx.getStorageSync('contacts') || []
    const selectedId = wx.getStorageSync('selected_contact_id') || ''
    const processed = contacts.map(function(item) {
      let labels = []
      if (item.identity_labels && Array.isArray(item.identity_labels)) {
        labels = item.identity_labels
      } else if (item.identity_label) {
        labels = [item.identity_label]
      }
      item.identity_label_display = labels.join(', ')
      item._contactId = String(item.id)
      item._isSelected = String(item.id) === String(selectedId)
      return item
    })
    // 批量处理头像，并写回 storage 固化
    processContactsAvatars(processed)
    wx.setStorageSync('contacts', processed)
    this.setData({ recentContacts: processed })
  },

  toggleContactSelect(e) {
    const id = String(e.currentTarget.dataset.id)
    const isSelected = this.data.recentContacts.find(function(c) {
      return String(c.id) === id
    })._isSelected
    
    if (isSelected) {
      // 点击已选中的名片，取消选中
      wx.setStorageSync('selected_contact_id', '')
      const recentContacts = this.data.recentContacts.map(function(item) {
        item._isSelected = false
        return item
      })
      this.setData({ recentContacts: recentContacts })
    } else {
      // 点击未选中的名片，选中它（单选）
      wx.setStorageSync('selected_contact_id', id)
      
      // 更新所有联系人的选中状态
      const recentContacts = this.data.recentContacts.map(function(item) {
        item._isSelected = String(item.id) === id
        return item
      })
      this.setData({ recentContacts: recentContacts })
    }
  },

  goToContacts() {
    wx.switchTab({
      url: '/pages/contacts/contacts'
    })
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
      const selectedId = wx.getStorageSync('selected_contact_id')
      let contactInfo = {}
      if (selectedId) {
        const contacts = wx.getStorageSync('contacts') || []
        const contact = contacts.find(function(c) {
          return String(c.id) === String(selectedId)
        })
        if (contact) {
          contactInfo = contact
        }
      }

      const result = await api.post('/analysis/generate', {
        message: this.data.message,
        context: this.data.context,
        contact_id: contactInfo.id || null,
        identity: contactInfo.identity || '',
        target: contactInfo.target || '',
        style: contactInfo.style || ''
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