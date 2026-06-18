// pages/contact-create/contact-create.js
const { showToast, isEmpty } = require('../../utils/helpers')

// 联系人身份选项 - 添加 emoji 图标
const identities = [
  { label: '暗恋对象', value: 'crush', icon: '💕' },
  { label: '男神', value: 'god', icon: '✨' },
  { label: '暧昧对象', value: 'ambiguous', icon: '💭' },
  { label: '追求者', value: 'pursuer', icon: '🌹' },
  { label: '相亲对象', value: 'blind_date', icon: '🤝' },
  { label: '普通朋友', value: 'friend', icon: '😊' },
  { label: '同学', value: 'classmate', icon: '📚' },
  { label: '同事', value: 'colleague', icon: '💼' },
  { label: '上司', value: 'boss', icon: '👔' },
  { label: '客户', value: 'client', icon: '📋' },
  { label: '甲方', value: 'party_a', icon: '🏢' },
  { label: '前任', value: 'ex', icon: '💔' },
  { label: '网友', value: 'netizen', icon: '💻' },
  { label: '游戏搭子', value: 'game_partner', icon: '🎮' },
  { label: '想拒绝的人', value: 'unwanted', icon: '🚫' },
  { label: '饭搭子', value: 'meal_partner', icon: '🍜' },
  { label: '年上', value: 'older', icon: '🧑‍🦳' },
  { label: '年下', value: 'younger', icon: '🧒' }
]

const targets = [
  { label: '先了解他', value: '了解', icon: '🔍' },
  { label: '提升好感', value: 'flirt', icon: '💖' },
  { label: '保持暧昧', value: 'ambiguous', icon: '💫' },
  { label: '让他主动', value: 'proactive', icon: '🎯' },
  { label: '保持朋友', value: 'friend', icon: '🤗' },
  { label: '委婉拒绝', value: 'reject', icon: '🙅' }
]

const styles = [
  { label: '温柔', value: 'gentle', icon: '🌸' },
  { label: '幽默', value: 'humor', icon: '😄' },
  { label: '高冷', value: 'cold', icon: '❄️' },
  { label: '可爱', value: 'cute', icon: '🐰' },
  { label: '成熟姐姐', value: 'mature', icon: '👩' },
  { label: '理性', value: 'rational', icon: '🧠' },
  { label: '自然随性', value: 'casual', icon: '🍃' },
  { label: '撩人', value: 'flirt', icon: '🔥' },
  { label: '傲娇', value: 'tsundere', icon: '😤' }
]

Page({
  data: {
    nickname: '',
    selectedIdentity: '',
    identities: identities,
    selectedTarget: '',
    targets: targets,
    selectedStyle: '',
    styles: styles
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value.substring(0, 20) })
  },

  selectIdentity(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedIdentity: value })
  },

  selectTarget(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedTarget: value })
  },

  selectStyle(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedStyle: value })
  },

  saveContact() {
    const { nickname, selectedIdentity, selectedTarget, selectedStyle } = this.data

    if (isEmpty(nickname)) {
      showToast('请输入联系人昵称')
      return
    }
    if (!selectedIdentity) {
      showToast('请选择他的身份')
      return
    }
    if (!selectedTarget) {
      showToast('请选择回复目标')
      return
    }
    if (!selectedStyle) {
      showToast('请选择回复风格')
      return
    }

    // 校验昵称重复
    const contacts = wx.getStorageSync('contacts') || []
    const existIndex = contacts.findIndex(c => c.nickname === nickname)
    if (existIndex >= 0) {
      showToast('该联系人已存在')
      return
    }

    const contact = {
      id: String(Date.now()),
      nickname,
      identity: selectedIdentity,
      identity_label: this.identifyLabel(selectedIdentity),
      target: selectedTarget,
      style: selectedStyle,
      avatar: ''
    }

    // 保存到本地
    contacts.push(contact)
    wx.setStorageSync('contacts', contacts)

    // 更新最近联系人
    const recent = wx.getStorageSync('recent_contacts') || []
    const existRecentIndex = recent.findIndex(c => String(c.id) === String(contact.id))
    if (existRecentIndex >= 0) recent.splice(existRecentIndex, 1)
    recent.unshift(contact)
    wx.setStorageSync('recent_contacts', recent.slice(0, 4))

    showToast('联系人保存成功')
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  identifyLabel(value) {
    const item = this.data.identities.find(i => i.value === value)
    return item ? item.label : value
  }
})