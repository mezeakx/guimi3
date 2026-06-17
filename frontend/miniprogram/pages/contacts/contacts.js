// pages/contacts/contacts.js
Page({
  data: {
    contacts: []
  },

  onLoad() {
    this.loadContacts()
  },

  onShow() {
    this.loadContacts()
  },

  loadContacts() {
    const contacts = wx.getStorageSync('contacts') || []
    this.setData({ contacts })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/contact-create/contact-create' })
  },

  deleteContact(e) {
    // data-id 会被转成字符串，需要统一转成字符串比较
    const id = String(e.currentTarget.dataset.id)
    // 从联系人列表中删除
    const contacts = this.data.contacts
      .map(c => ({ ...c, id: String(c.id) }))
      .filter(c => c.id !== id)
    wx.setStorageSync('contacts', contacts)
    this.setData({ contacts })

    // 同步从最近联系人中删除
    const recent = wx.getStorageSync('recent_contacts') || []
    const filteredRecent = recent
      .map(c => ({ ...c, id: String(c.id) }))
      .filter(c => c.id !== id)
    wx.setStorageSync('recent_contacts', filteredRecent)

    wx.showToast({ title: '已删除', icon: 'success' })
  }
})