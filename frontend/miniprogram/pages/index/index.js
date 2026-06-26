// pages/index/index.js
const api = require('../../utils/http')
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

    // 我的人设
    selectedPersona: '普通女生',
    personaInfo: {},
    personaOptions: [
      { value: '普通女生', label: '普通女生', name: '普通女生', features: '不营造人设，喜欢自然真实的聊天\n不会刻意撩人，也不会故意高冷\n表达舒服、有礼貌，适合大多数场景', example: '哈哈可以呀\n你说的那个地方我没去过呢' },
      { value: '纯情女大', label: '纯情女大', name: '纯情女大', features: '有点害羞和慢热，熟了以后才会放松\n嘴上总爱逞强，实际上心软又好哄', example: '嗯……让我想想嘛\n也没有很想去啦' },
      { value: '温柔姐姐', label: '温柔姐姐', name: '温柔姐姐', features: '喜欢用温柔体贴的方式表达\n很少发脾气，不喜欢争吵\n不喜欢过度卖萌，更注重照顾对方感受', example: '辛苦啦~\n要不要一起吃个饭放松一下？' },
      { value: '元气少女', label: '元气少女', name: '元气少女', features: '喜欢轻松愉快的聊天，情绪感染力很强\n喜欢使用表情和感叹词\n热情开朗，擅长制造聊天氛围', example: '好耶！终于有空啦～\n我们快去快回！✨' },
      { value: '邻家甜妹', label: '邻家甜妹', name: '邻家甜妹', features: '喜欢可爱、软萌的表达方式\n偶尔撒娇，偶尔使用颜文字、表情和语气词\n聊天时总能让人感受到甜甜的陪伴感', example: '好呀好呀 (◍•ᴗ•◍)\n你真好～' },
      { value: '小迷妹', label: '小迷妹', name: '小迷妹', features: '崇拜感和情绪价值拉满\n总是毫不吝啬夸奖\n黏人又热情，会把对方放在很重要的位置', example: '你好厉害啊！\n我怎么这么幸运能认识你' },
      { value: '钓系御姐', label: '钓系御姐', name: '钓系御姐', features: '举止从容，擅长把握聊天节奏\n不会把喜欢表现的太明显\n时而主动时而疏离，总带着一点若有若无的神秘和撩拨', example: '哦？是吗～\n那看你表现咯' },
      { value: '霸气女王', label: '霸气女王', name: '霸气女王', features: '自信独立，做事有自己的原则和想法\n表达直接坦率，不讨好别人，也不会轻易被影响\n喜欢平等、直接的交流方式', example: '行啊，我来定\n周六晚上七点' },
      { value: '高冷美人', label: '高冷美人', name: '高冷美人', features: '清冷克制，带着明显的距离感\n不会轻易敞开心扉，回复简短\n很难轻易被打动', example: '嗯\n随便你' },
      { value: '酷女孩', label: '酷女孩', name: '酷女孩', features: '性格随性洒脱，偶尔耍酷\n不喜欢矫情，内耗，过度拉扯\n相处轻松自在，自带松弛感', example: '随便你啦\n不过我可不是因为想你才说的哦' },
      { value: '成熟理性派', label: '成熟理性派', name: '成熟理性派', features: '习惯用逻辑分析问题，情绪稳定且有边界感\n遇事冷静客观，遇到问题喜欢直接沟通和解决', example: '我觉得我们可以好好聊聊\n说说你的想法' },
      { value: '抽象搞笑女', label: '抽象搞笑女', name: '抽象搞笑女', features: '天生段子手，脑回路清奇\n聊天主打一个有趣，不喜欢太严肃\n擅长玩梗和整活，聊天永远不缺笑点和意想不到的展开', example: '你这是在跟我表白吗\n那我先考虑一下要不要接受 (^_^)' },
      { value: '毒舌吐槽怪', label: '毒舌吐槽怪', name: '毒舌吐槽怪', features: '嘴巴很毒，看到什么都忍不住吐槽两句\n擅长接梗、回怼和阴阳怪气\n面对挑衅从不示弱，但没什么坏心思', example: '就这？你也配\n别说了，我都替你尴尬' }
    ],

    remainingCount: 3,
    recentContacts: [],
    generating: false,
    imageUrl: "",
    selectedRelationships: [],
    relationshipOptions: [
      { label: '暧昧中', value: '暧昧中', group: 'neutral', selected: false },
      { label: '刚认识', value: '刚认识', group: 'neutral', selected: false },
      { label: '被追求中', value: '被追求中', group: 'neutral', selected: false },
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
        { label: '有点开心', value: '有点开心', selected: false },
        { label: '有点害羞', value: '有点害羞', selected: false },
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

    // 我的想法帮助弹窗
    showThoughtHelpModal: false,

    // 前情提要帮助弹窗
    showContextHelpModal: false,
  },

  onLoad() {
    this.loadRemainingCount()
    this.loadRecentContacts()
    this._initCurrentOptions('affection')
    this._initPersonaInfo()
  },

  onShow() {
    // 从 storage 恢复上一次填写的表单数据
    this._restoreFormFromStorage()
    this.loadRecentContacts()
  },

  /** 从 storage 恢复首页表单数据 */
  _restoreFormFromStorage: function() {
    try {
      var saved = wx.getStorageSync('__restore_index__')
      if (!saved) return

      var obj = {}
      if (saved.message !== undefined) {
        obj.message = saved.message
        obj.charCount = (saved.message || '').length
      }
      if (saved.context !== undefined) {
        obj.context = saved.context
        obj.contextCount = (saved.context || '').length
      }
      if (saved.persona !== undefined) {
        var persona = this.data.personaOptions.find(function(item) { return item.value === saved.persona })
        obj.selectedPersona = saved.persona
        obj.personaInfo = persona ? { name: persona.name, features: persona.features, example: persona.example } : this.data.personaInfo
      }

      if (Object.keys(obj).length) {
        this.setData(obj)
      }
      // 清理缓存，避免下次误恢复
      wx.removeStorageSync('__restore_index__')
    } catch (e) {
      // ignore
    }
  },


  // 初始化 personaInfo（页面加载时调用）
  _initPersonaInfo() {
    const value = this.data.selectedPersona
    const persona = this.data.personaOptions.find(function(item) {
      return item.value === value
    })
    if (persona) {
      this.setData({
        personaInfo: {
          name: persona.name,
          features: persona.features,
          example: persona.example
        }
      })
    }
  },

  // 选择人设
  selectPersona(e) {
    const value = e.currentTarget.dataset.value
    const persona = this.data.personaOptions.find(function(item) {
      return item.value === value
    })
    this.setData({
      selectedPersona: value,
      personaInfo: persona ? {
        name: persona.name,
        features: persona.features,
        example: persona.example
      } : this.data.personaInfo
    })
  },

  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ inputMode: mode })
    if (mode === 'image') {
      this.uploadImage()
    }
  },

  // 初始化当前分类选项 — 从 thoughtOptions 源数据读取，不覆盖已保存的选中状态
  _initCurrentOptions(category) {
    const srcOpts = this.data.thoughtOptions[category] || []
    const opts = srcOpts.map(function(item) {
      var o = { label: item.label, value: item.value, selected: item.selected || false }
      if (item.group) o.group = item.group
      return o
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
    // 情绪分类中，"有点开心"与"有点委屈/有点吃醋/有点生气/有点失落/有点不耐烦"互斥
    // 后五个选项之间可以多选，"有点害羞"始终自由
    if (category === 'emotion' && value === '有点开心') {
      const clicked = options.find(function(item) { return item.value === value })
      if (clicked && clicked.selected) {
        options.forEach(function(item) {
          if (['有点委屈', '有点吃醋', '有点生气', '有点失落', '有点不耐烦'].indexOf(item.value) !== -1) {
            item.selected = false
          }
        })
      }
    } else if (category === 'emotion' && ['有点委屈', '有点吃醋', '有点生气', '有点失落', '有点不耐烦'].indexOf(value) !== -1) {
      const clicked = options.find(function(item) { return item.value === value })
      if (clicked && clicked.selected) {
        options.forEach(function(item) {
          if (item.value === '有点开心') {
            item.selected = false
          }
        })
      }
    }
    this.setData({ currentThoughtOptions: options })

    // 同步更新 thoughtOptions 源数据，保证切回该分类时选中状态不丢失
    const updatedThoughtOptions = Object.assign({}, this.data.thoughtOptions)
    updatedThoughtOptions[category] = options
    this.setData({ thoughtOptions: updatedThoughtOptions })
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
    this.setData({ showThoughtHelpModal: true })
  },

  closeThoughtHelpModal() {
    this.setData({ showThoughtHelpModal: false })
  },

  showContextHelp() {
    this.setData({ showContextHelpModal: true })
  },

  closeContextHelpModal() {
    this.setData({ showContextHelpModal: false })
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

    // 确保已登录（token 就绪）
    if (!wx.getStorageSync('token')) {
      try {
        await getApp().login()
      } catch (e) {
        console.error('自动登录失败:', e)
        showToast('登录失败，请重试')
        return
      }
    }

    if (this.data.generating) return

    this.setData({ generating: true })
    showLoading('分析中..')

    this.proceedWithGeneration()
  },

  proceedWithGeneration() {
    // 读取已选联系人的风格
    const selectedId = wx.getStorageSync('selected_contact_id') || ''
    const allContacts = wx.getStorageSync('contacts') || []
    const selectedContact = allContacts.find(function(c) {
      return String(c.id) === String(selectedId)
    })
    // style_labels 是风格的中文标签数组，如 ['温柔', '可爱']
    var contactStyles = []
    if (selectedContact && selectedContact.style_labels && Array.isArray(selectedContact.style_labels)) {
      contactStyles = selectedContact.style_labels
    }

    var self = this
    var payload = {
      message: this.data.message || '',
      context: this.data.context || '',
      contact_id: selectedId ? Number(selectedId) : null,
      persona: this.data.selectedPersona || '普通女生',
      thoughtCategories: [],
      thoughtCustom: this.data.thoughtCustom || '',
      relationshipOptions: []
    }

    // 收集选中的想法标签
    this.data.currentThoughtOptions.forEach(function(opt) {
      if (opt.selected) {
        payload.thoughtCategories.push(opt.value)
      }
    })

    // 收集选中的关系标签
    this.data.relationshipOptions.forEach(function(opt) {
      if (opt.selected) {
        payload.relationshipOptions.push(opt.value)
      }
    })

    // 收集联系人的身份/目标/风格标签
    if (selectedContact) {
      if (selectedContact.identity_labels) payload.identity_labels = selectedContact.identity_labels
      if (selectedContact.target_labels) payload.target_labels = selectedContact.target_labels
      if (selectedContact.style_labels) payload.style_labels = selectedContact.style_labels
    }

    showLoading('分析中..')

    api.post('/analysis/generate', payload)
      .then(function(res) {
        hideLoading()
        self.setData({ generating: false })

        // res 是 http.js resolve 的完整响应
        if (res && res.data) {
          var resultData = res.data

          // 兼容两层 data 嵌套的情况
          var analysisData = resultData.data || resultData

          // 检查是否是错误提示
          if (!analysisData.replies && !analysisData.thinking && !analysisData.reply_A) {
            if (resultData.message) {
              showToast(resultData.message)
            } else {
              showToast('生成失败，请稍后再试')
            }
            return
          }

          // 合并联系人的风格标签到回复数据
          analysisData.contactStyles = contactStyles
          if (res.remaining !== undefined) {
            self.setData({ remainingCount: res.remaining })
          }
          // 清理旧的缓存，确保新数据被正确加载
          try { wx.removeStorageSync('__result_data__') } catch (e) {}
          // 通过 storage 缓存完整数据
          try {
            wx.setStorageSync('__result_data__', analysisData)
          } catch (e) {
            console.error('[index] storage write failed:', e)
          }
          wx.navigateTo({
            url: '/pages/result/result'
          })
        } else {
          showToast('生成失败，请稍后再试')
          self.setData({ generating: false })
        }
      })
      .catch(function(err) {
        hideLoading()
        self.setData({ generating: false })
        console.error('API 请求失败:', err)
        showToast('请求失败: ' + (err.message || '请稍后再试'))
      })
  },

  // 跳过联系人直接生成
  async proceedGenerate() {
    if (this.data.remainingCount <= 0) {
      showToast('今日次数已用完，观看广告获取更多')
      return
    }
    if (this.data.generating) return

    // 确保已登录
    if (!wx.getStorageSync('token')) {
      try {
        await getApp().login()
      } catch (e) {
        console.error('自动登录失败:', e)
        showToast('登录失败，请重试')
        return
      }
    }

    this.setData({ generating: true })
    showLoading('分析中..')

    this.proceedWithGeneration()
  }
})