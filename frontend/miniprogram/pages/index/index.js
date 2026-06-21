// pages/index/index.js
const { processContactsAvatars } = require('../../utils/identity-avatar')
const config = require('../../config/index')
const { countChars, showLoading, hideLoading, isEmpty, showToast } = require('../../utils/helpers')

Page({
  data: {
    inputMode: 'image',
    message: '',
    context: '',
    charCount: 0,
    contextCount: 0,
    maxMessage: config.maxMessageLength,
    maxContext: config.maxContextLength,
    // 聊天节奏
    paceValue: 25,
    paceInfo: {},
    paceLevels: [
      { value: 0, name: '直球模式', features: '有话直说，不绕弯', example: '好啊\n你想吃什么？' },
      { value: 25, name: '自然模式', features: '真实表达，不刻意设计', example: '哈哈可以呀\n你有什么推荐吗？' },
      { value: 50, name: '慢热模式', features: '表达但保留空间', example: '最近有点忙，\n看看时间怎么安排~' },
      { value: 75, name: '暧昧模式', features: '不说透，让对方接话', example: '这么突然约我呀' },
      { value: 100, name: '拉扯模式', features: '制造猜测，保留神秘感', example: '你猜我会怎么想~' }
    ],
    remainingCount: 3,
    recentContacts: [],
    generating: false,
    imageUrl: "",
    selectedRelationships: [],
    relationshipOptions: [
      { label: '暧昧中', value: '暧昧中', group: 'neutral', selected: false },
      { label: '刚认识', value: '刚认识', group: 'neutral', selected: false },
      { label: '恋爱中', value: '恋爱中', group: 'neutral', selected: false },
      { label: '冷战中', value: '冷战中', group: 'neutral', selected: false },
      { label: '刚吵架', value: '刚吵架', group: 'mutually_exclusive_1', selected: false },
      { label: '刚和好', value: '刚和好', group: 'mutually_exclusive_1', selected: false },
      { label: '异地', value: '异地', group: 'neutral', selected: false },
      { label: '刚约会完', value: '刚约会完', group: 'neutral', selected: false },
      { label: '我主动较多', value: '我主动较多', group: 'mutually_exclusive_2', selected: false },
      { label: '他主动较多', value: '他主动较多', group: 'mutually_exclusive_2', selected: false }
    ],
    exclusiveGroups: {
      'mutually_exclusive_1': ['刚吵架', '刚和好'],
      'mutually_exclusive_2': ['我主动较多', '他主动较多']
    },

    // ========== 我的想法模块 ==========
    activeThoughtCategory: 'affection',
    thoughtCategories: [
      { key: 'affection', name: '好感升温', icon: '🩷' },
      { key: 'emotion', name: '我的情绪', icon: '😊' },
      { key: 'distance', name: '保持距离', icon: '🧊' },
      { key: 'observe', name: '观察试探', icon: '🔍' },
      { key: 'expression', name: '表达方式', icon: '📞' },
      { key: 'complex', name: '复合场景', icon: '🖇' }
    ],
    thoughtOptions: {
      affection: [
        { label: '想让他主动', value: '想让他主动', selected: false },
        { label: '想约他出来', value: '想约他出来', selected: false },
        { label: '想暗示有好感', value: '想暗示有好感', selected: false },
        { label: '想表达欣赏', value: '想表达欣赏', selected: false },
        { label: '想表达想念', value: '想表达想念', selected: false },
        { label: '想让他反思一下', value: '想让他反思一下', selected: false },
        { label: '想让他哄我', value: '想让他哄我', selected: false },
        { label: '想表达感谢', value: '想表达感谢', selected: false }
      ],
      emotion: [
        { label: '有点委屈', value: '有点委屈', selected: false },
        { label: '有点吃醋', value: '有点吃醋', selected: false },
        { label: '有点生气', value: '有点生气', selected: false },
        { label: '有点失落', value: '有点失落', selected: false },
        { label: '有点不耐烦', value: '有点不耐烦', selected: false }
      ],
      distance: [
        { label: '想委婉拒绝', value: '想委婉拒绝', selected: false },
        { label: '想表达不满', value: '想表达不满', selected: false },
        { label: '想保持朋友关系', value: '想保持朋友关系', selected: false },
        { label: '不想见面', value: '不想见面', selected: false },
        { label: '想结束话题', value: '想结束话题', selected: false },
        { label: '想委婉拒绝邀约', value: '想委婉拒绝邀约', selected: false },
        { label: '想慢慢疏远', value: '想慢慢疏远', selected: false }
      ],
      observe: [
        { label: '想试探他的想法', value: '想试探他的想法', selected: false },
        { label: '想看看他会不会主动', value: '想看看他会不会主动', selected: false },
        { label: '想确认关系进展', value: '想确认关系进展', selected: false },
        { label: '想测试他的诚意', value: '想测试他的诚意', selected: false }
      ],
      expression: [
        { label: '不想显得太主动', value: '不想显得太主动', selected: false },
        { label: '想保持神秘感', value: '想保持神秘感', selected: false },
        { label: '想表现得成熟一点', value: '想表现得成熟一点', selected: false },
        { label: '想显得有边界感', value: '想显得有边界感', selected: false },
        { label: '想自然一点', value: '想自然一点', selected: false },
        { label: '不想秒答应', value: '不想秒答应', selected: false },
        { label: '想留点余地', value: '想留点余地', selected: false }
      ],
      complex: [
        { label: '还没完全放下', value: '还没完全放下', selected: false },
        { label: '想重新了解他', value: '想重新了解他', selected: false },
        { label: '想给一次机会', value: '想给一次机会', selected: false },
        { label: '想拒绝复合', value: '想拒绝复合', selected: false },
        { label: '不想重蹈覆辙', value: '不想重蹈覆辙', selected: false }
      ]
    },
    thoughtCustom: '',
    thoughtCustomCount: 0,
    currentThoughtOptions: [],

    // 未选择联系人弹窗
    showContactModal: false,
  },

  onLoad() {
    this.loadRemainingCount()
    this.loadRecentContacts()
    this._initCurrentOptions('affection')
    this._initPaceInfo()
  },

  onShow() {
    this.loadRecentContacts()
  },


  // 初始化 paceInfo（页面加载时调用）
  _initPaceInfo() {
    const value = this.data.paceValue
    const level = this.data.paceLevels.find(function(item) {
      return item.value === value
    })
    if (level) {
      this.setData({
        paceInfo: {
          name: level.name,
          features: level.features,
          example: level.example
        }
      })
    }
  },

  // 选择聊天节奏档位
  selectPaceLevel(e) {
    const value = parseInt(e.currentTarget.dataset.value)
    const level = this.data.paceLevels.find(function(item) {
      return item.value === value
    })
    this.setData({
      paceValue: value,
      paceInfo: level ? {
        name: level.name,
        features: level.features,
        example: level.example
      } : this.data.paceInfo
    })
  },

    switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ inputMode: mode })
    if (mode === 'image') {
      this.uploadImage()
    }
  },

  // 初始化当前分类选项
  _initCurrentOptions(category) {
    const opts = (this.data.thoughtOptions[category] || []).map(function(item) {
      return { label: item.label, value: item.value, selected: item.selected || false }
    })
    this.setData({ currentThoughtOptions: opts })
  },

  // 切换子分类 Tab
  switchThoughtCategory(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ activeThoughtCategory: key })
    this._initCurrentOptions(key)
  },

  // 选择想法选项
  selectThoughtOption(e) {
    const value = e.currentTarget.dataset.value
    const category = this.data.activeThoughtCategory
    const options = this.data.currentThoughtOptions.map(function(item) {
      if (item.value === value) {
        item.selected = !item.selected
      }
      return item
    })
    this.setData({ currentThoughtOptions: options })
  },

  // 切换关系标签
  selectRelationship(e) {
    const value = e.currentTarget.dataset.value
    const optionIndex = this.data.relationshipOptions.findIndex(function(item) {
      return item.value === value
    })
    if (optionIndex === -1) return

    // 收集当前已选中的值
    let selected = []
    this.data.relationshipOptions.forEach(function(item) {
      if (item.selected) {
        selected.push(item.value)
      }
    })

    const option = this.data.relationshipOptions[optionIndex]

    if (option.group && option.group.startsWith('mutually_exclusive')) {
      const groupKey = option.group
      const groupValues = this.data.exclusiveGroups[groupKey]

      if (option.selected) {
        // 已选中，取消选中
        selected = selected.filter(function(v) {
          return v !== value
        })
      } else {
        // 未选中，移除同组的选项
        selected = selected.filter(function(v) {
          return groupValues.indexOf(v) === -1
        })
        selected.push(value)
      }
    } else {
      if (option.selected) {
        selected = selected.filter(function(v) {
          return v !== value
        })
      } else {
        selected.push(value)
      }
    }

    // 更新所有选项的 selected 状态
    const updatedOptions = this.data.relationshipOptions.map(function(item) {
      item.selected = selected.indexOf(item.value) !== -1
      return item
    })

    this.setData({
      relationshipOptions: updatedOptions
    })
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
    const contact = this.data.recentContacts.find(function(c) {
      return String(c.id) === id
    })
    if (!contact) return
    
    const isSelected = contact._isSelected
    
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
    // 仅显示截图缩略图
    this.setData({
      imageUrl: filePath
    })
  },
  previewImage() {
    if (!this.data.imageUrl) return
    wx.previewImage({
      current: this.data.imageUrl,
      urls: [this.data.imageUrl]
    })
  },

  /** 移除截图 */
  removeImage() {
    this.setData({
      imageUrl: "",
      message: ''
    })
  },

  onMessageInput(e) {
    const value = e.detail.value
    this.setData({
      message: value,
      charCount: countChars(value)
    })
  },

  onContextInput(e) {
    const value = e.detail.value
    this.setData({
      context: value,
      contextCount: countChars(value)
    })
  },

  onThoughtCustomInput(e) {
    const value = e.detail.value
    this.setData({
      thoughtCustom: value,
      thoughtCustomCount: countChars(value)
    })
  },

  showThoughtHelp() {
    wx.navigateTo({ url: '/pages/usage/usage' })
  },

  // ========== 未选择联系人弹窗 ==========
  checkContactSelection() {
    const selectedId = wx.getStorageSync('selected_contact_id') || ''
    const hasSelected = this.data.recentContacts.some(function(c) {
      return c._isSelected
    })
    return !!(selectedId || hasSelected)
  },

  showContactModal() {
    this.setData({ showContactModal: true })
  },

  closeContactModal() {
    this.setData({ showContactModal: false })
  },

  goToAddContact() {
    this.closeContactModal()
    wx.navigateTo({ url: '/pages/contact-create/contact-create' })
  },

  chooseExistingContact() {
    this.closeContactModal()
    // 回到首页（switchTab 会触发 onShow，loadRecentContacts 会刷新联系人列表）
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        // 等待页面渲染完成后滚动到最近联系人区域
        setTimeout(() => {
          const query = wx.createSelectorQuery().in(this)
          query.select('#recentContactsSection').boundingClientRect()
          query.select('.container').boundingClientRect()
          query.exec((res) => {
            if (res && res[0] && res[1]) {
              const top = res[0].top - res[1].top
              wx.pageScrollTo({
                scrollTop: top,
                duration: 300
              })
            }
          })
        }, 300)
      }
    })
  },

  skipContactAndGenerate() {
    this.closeContactModal()
    // 直接执行生成逻辑
    this.proceedGenerate()
  },

  async generateReply() {
    // 校验输入：文字模式需要 message，图片模式需要 imageUrl
    if (this.data.inputMode === 'image') {
      if (!this.data.imageUrl) {
        showToast('请提交截图或文字后再生成回复')
        return
      }
    } else {
      if (this.data.inputMode === "text" && isEmpty(this.data.message)) {
        showToast('请提交截图或文字后再生成回复')
        return
      }
    }

    // 检查是否选择了联系人
    if (!this.checkContactSelection()) {
      this.showContactModal()
      return
    }

    if (this.data.remainingCount <= 0) {
      showToast('今日次数已用完，观看广告获取更多')
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })
    showLoading('分析中..')

    this.proceedWithGeneration()
  },

  proceedWithGeneration() {
    // 直接使用 mock 数据，不调用后端
    setTimeout(() => {
      hideLoading()
      const newCount = this.data.remainingCount - 1
      this.setData({ remainingCount: newCount, generating: false })

      const mockResult = {
        thinking: '他主动找你聊天，并持续追问你的情况，大概率希望继续推进关系。',
        thinkingTags: ['对你有兴趣', '想继续话题', '期待你给出反馈'],
        remind: '不建议过于主动，把节奏放慢一点，先观察他的投入程度，保持轻松自然。',
        remindTags: ['不要立刻答应见面', '先继续聊天观察'],
        replies: [
          { text: '哈哈可以呀～不过我对那边不太熟，你有什么推荐吗？', style: '稳妥自然', active: 2, good: 4, rhythm: '自然' },
          { text: '听起来还不错～有机会可以一起去看看呀～', style: '提升好感', active: 3, good: 5, rhythm: '稍快' },
          { text: '怎么突然想约我啦～', style: '轻微拉扯', active: 1, good: 3, rhythm: '慢热' }
        ]
      }

      wx.navigateTo({
        url: '/pages/result/result?data=' + encodeURIComponent(JSON.stringify(mockResult))
      })
    }, 600)
  },

  // 跳过联系人直接生成
  proceedGenerate() {
    if (this.data.remainingCount <= 0) {
      showToast('今日次数已用完，观看广告获取更多')
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })
    showLoading('分析中..')

    this.proceedWithGeneration()
  }
})