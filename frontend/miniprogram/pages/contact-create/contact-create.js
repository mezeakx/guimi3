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
  { label: '发小', value: 'childhood_friend', icon: '🤜' },
  { label: '前任', value: 'ex', icon: '💔' },
  { label: '网友', value: 'netizen', icon: '💻' },
  { label: '游戏搭子', value: 'game_partner', icon: '🎮' },
  { label: '想拒绝的人', value: 'unwanted', icon: '🚫' },
  { label: '饭搭子', value: 'meal_partner', icon: '🍜' },
  { label: '年上', value: 'older', icon: '🤵' },
  { label: '年下', value: 'younger', icon: '🧒' }
]

// 年上和年下是互斥组
const MUTEX_GROUP = ['older', 'younger']

// 多选最大数量
const MAX_IDENTITIES = 4
const MAX_TARGETS = 1
const MAX_STYLES = 2
const MIN_STYLES = 1

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
  { label: '成熟姐姐', value: 'mature', icon: '👠' },
  { label: '理性', value: 'rational', icon: '🧠' },
  { label: '自然随性', value: 'casual', icon: '🍃' },
  { label: '撩人', value: 'flirt', icon: '🔥' },
  { label: '傲娇', value: 'tsundere', icon: '😤' }
]

Page({
  data: {
    nickname: '',
    selectedIdentities: [],
    selectedIdentityMap: {},
    maxIdentities: MAX_IDENTITIES,
    identities: identities,
    selectedTargets: [],
    selectedTargetMap: {},
    maxTargets: MAX_TARGETS,
    targets: targets,
    selectedStyles: [],
    selectedStyleMap: {},
    maxStyles: MAX_STYLES,
    styles: styles
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value.substring(0, 20) })
  },

  /**
   * 选择身份（多选，最多4个；年上/年下互斥）
   */
  selectIdentity(e) {
    const value = e.currentTarget.dataset.value
    const selected = this.data.selectedIdentities.slice()
    const identityMap = Object.assign({}, this.data.selectedIdentityMap)

    // 判断是否已选中
    const isSelected = identityMap[value] === true
    const index = selected.indexOf(value)

    // 如果点击的是年上或年下，处理互斥逻辑
    if (MUTEX_GROUP.includes(value)) {
      if (isSelected) {
        // 取消选中：移除该项
        selected.splice(index, 1)
        delete identityMap[value]
      } else {
        // 选中：先移除互斥项，再添加当前项
        const newSelected = []
        const newMap = {}
        selected.forEach(function(v) {
          if (!MUTEX_GROUP.includes(v)) {
            newSelected.push(v)
            newMap[v] = true
          }
        })
        newSelected.push(value)
        newMap[value] = true
        this.setData({
          selectedIdentities: newSelected,
          selectedIdentityMap: newMap
        })
        return
      }
    } else {
      // 普通选项：正常多选/取消
      if (isSelected) {
        selected.splice(index, 1)
        delete identityMap[value]
      } else {
        // 已达上限，不允许继续选
        if (selected.length >= MAX_IDENTITIES) {
          showToast('最多选择4个身份')
          return
        }
        selected.push(value)
        identityMap[value] = true
      }
    }

    this.setData({
      selectedIdentities: selected,
      selectedIdentityMap: identityMap
    })
  },

  /**
   * 选择回复目标（单选，有且只能选择一个，可取消）
   */
  selectTarget(e) {
    const value = e.currentTarget.dataset.value
    const selected = this.data.selectedTargets.slice()
    const targetMap = Object.assign({}, this.data.selectedTargetMap)

    // 判断是否已选中
    const isSelected = targetMap[value] === true

    if (isSelected) {
      // 取消选中
      selected.length = 0
      for (const key in targetMap) {
        delete targetMap[key]
      }
    } else {
      // 清空之前的选择，设置新的
      selected.length = 0
      for (const key in targetMap) {
        delete targetMap[key]
      }
      selected.push(value)
      targetMap[value] = true
    }

    this.setData({
      selectedTargets: selected,
      selectedTargetMap: targetMap
    })
  },

  /**
   * 选择回复风格（多选，最少1个，最多2个）
   */
  selectStyle(e) {
    const value = e.currentTarget.dataset.value
    const selected = this.data.selectedStyles.slice()
    const styleMap = Object.assign({}, this.data.selectedStyleMap)

    // 判断是否已选中
    const isSelected = styleMap[value] === true

    if (isSelected) {
      // 取消选中
      const index = selected.indexOf(value)
      if (index > -1) {
        selected.splice(index, 1)
      }
      delete styleMap[value]
    } else {
      // 已达上限，不允许继续选
      if (selected.length >= MAX_STYLES) {
        showToast('最多选择2个风格')
        return
      }
      selected.push(value)
      styleMap[value] = true
    }

    this.setData({
      selectedStyles: selected,
      selectedStyleMap: styleMap
    })
  },

  saveContact() {
    const { nickname, selectedIdentities, selectedTargets, selectedStyles } = this.data

    if (isEmpty(nickname)) {
      showToast('请输入联系人昵称')
      return
    }
    if (selectedIdentities.length === 0) {
      showToast('请选择他的身份')
      return
    }
    if (selectedTargets.length === 0) {
      showToast('请选择回复目标')
      return
    }
    if (selectedStyles.length < MIN_STYLES) {
      showToast('请至少选择一个回复风格')
      return
    }
    if (selectedStyles.length > MAX_STYLES) {
      showToast('最多选择2个回复风格')
      return
    }

    // 校验昵称重复
    const contacts = wx.getStorageSync('contacts') || []
    const existIndex = contacts.findIndex(c => c.nickname === nickname)
    if (existIndex >= 0) {
      showToast('该联系人已存在')
      return
    }

    // 获取选中身份的标签
    const labels = selectedIdentities.map(v => {
      const item = this.data.identities.find(i => i.value === v)
      return item ? item.label : v
    })

    // 获取选中目标的标签
    const targetLabels = selectedTargets.map(v => {
      const item = this.data.targets.find(i => i.value === v)
      return item ? item.label : v
    })

    // 获取选中风格的标签
    const styleLabels = selectedStyles.map(v => {
      const item = this.data.styles.find(i => i.value === v)
      return item ? item.label : v
    })

    const contact = {
      id: String(Date.now()),
      nickname,
      identities: selectedIdentities,
      identity_labels: labels,
      target: selectedTargets,
      target_labels: targetLabels,
      style: selectedStyles,
      style_labels: styleLabels,
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
  }
})