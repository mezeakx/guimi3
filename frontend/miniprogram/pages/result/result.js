// pages/result/result.js
const api = require('../../utils/http')
const { copyToClipboard, showToast, showLoading, hideLoading } = require('../../utils/helpers')

Page({
  data: {
    // 分析数据
    analysis: {
      thinking: '',
      remind: '',
      thinkingTags: [],
      remindTags: []
    },
    // 三条回复
    replies: [],
    // 原始数据
    rawData: null,
    // 当前使用的消息上下文
    currentMessage: '',
    currentContext: '',
    currentPace: 25,
    currentContactId: null,
    // 联系人选择的风格标签数组，如 ['温柔', '可爱']
    contactStyles: []
  },

  onLoad(options) {
    if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data))
        console.log('[result] parsed data:', JSON.stringify(data))
        this._processReplyData(data)
      } catch (e) {
        console.error('解析返回数据失败:', e)
        this._setDefaultReplies()
      }
    } else {
      // 没有数据，显示默认占位
      this._setDefaultReplies()
    }
  },

  onShow() {
    // 每次显示页面时，尝试从 storage 恢复上下文
    this._restoreContext()
  },

  /** 处理后端返回的分析数据 */
  _processReplyData(data) {
    if (!data) {
      console.warn('_processReplyData: data is null/undefined')
      this._setDefaultReplies()
      return
    }

    const replies = []

    // 兼容多种返回格式
    if (Array.isArray(data.replies)) {
      data.replies.forEach(function(r) {
        if (!r) return
        replies.push({
          text: r.text || r.content || '',
          style: r.style || r.label || '',
          active: Number(r.active) || Number(r.stars_active) || 2,
          good: Number(r.good) || Number(r.stars_good) || 4,
          rhythm: r.rhythm || r.pace || ''
        })
      })
    } else if (data.reply_A || data.reply_B || data.reply_C) {
      // 旧格式兼容：用 contactStyles 填充 style 标签
      var cs = data.contactStyles || []
      var baseStyle = cs[0] || '稳妥自然'
      var sA = baseStyle
      var sB = cs.length >= 2 ? cs[1] : baseStyle
      var sC = cs.length >= 2 ? cs[0] + '+' + cs[1] : (cs[0] ? cs[0] + '+自然' : '轻微拉扯')
      replies.push({
        text: data.reply_A || '',
        style: data.style_A || sA,
        active: Number(data.active_A) || 2,
        good: Number(data.good_A) || 4,
        rhythm: data.rhythm_A || '自然'
      })
      replies.push({
        text: data.reply_B || '',
        style: data.style_B || sB,
        active: Number(data.active_B) || 3,
        good: Number(data.good_B) || 5,
        rhythm: data.rhythm_B || '稍快'
      })
      replies.push({
        text: data.reply_C || '',
        style: data.style_C || sC,
        active: Number(data.active_C) || 1,
        good: Number(data.good_C) || 3,
        rhythm: data.rhythm_C || '慢热'
      })
    }

    // 分析数据
    var analysis = {
      thinking: data.thinking || data.boy_intent || data.analysis || '',
      remind: data.remind || data.risk_warning || data.warning || '',
      thinkingTags: Array.isArray(data.thinking_tags) ? data.thinking_tags : (Array.isArray(data.tags) ? data.tags.filter(function(t) { return t && t.type === 'thinking'; }) : []),
      remindTags: Array.isArray(data.remind_tags) ? data.remind_tags : (Array.isArray(data.tags) ? data.tags.filter(function(t) { return t && t.type === 'remind'; }) : [])
    }

    this.setData({
      analysis: analysis,
      replies: replies.length ? replies : this.data.replies,
      rawData: data,
      currentMessage: data.message || '',
      currentContext: data.context || '',
      currentPace: Number(data.pace) || 25,
      currentContactId: data.contact_id || null,
      contactStyles: data.contactStyles || []
    })
  },

  /** 设置默认回复占位 */
  _setDefaultReplies: function() {
    var styles = this.data.contactStyles || []
    var baseStyle = styles[0] || '风格一'
    var styleA = baseStyle
    var styleB = styles.length >= 2 ? styles[1] : baseStyle
    var styleC = styles.length >= 2
      ? styles[0] + '+' + styles[1]
      : (styles[0] ? styles[0] + '+自然' : '风格一+自然')

    this.setData({
      replies: [
        { text: '加载中...', style: styleA, active: 2, good: 4, rhythm: '自然' },
        { text: '加载中...', style: styleB, active: 3, good: 5, rhythm: '稍快' },
        { text: '加载中...', style: styleC, active: 1, good: 3, rhythm: '慢热' }
      ]
    })
  },

  /** 从 storage 恢复上下文 */
  _restoreContext: function() {
    try {
      var msg = wx.getStorageSync('last_message')
      var ctx = wx.getStorageSync('last_context')
      var pace = wx.getStorageSync('last_pace')
      var cid = wx.getStorageSync('selected_contact_id')
      if (msg) this.setData({ currentMessage: msg })
      if (ctx) this.setData({ currentContext: ctx })
      if (pace) this.setData({ currentPace: Number(pace) })
      if (cid) this.setData({ currentContactId: cid })
    } catch (e) {
      // ignore
    }
  },

  /** 复制回复 */
  copyReply: function(e) {
    var idx = e.currentTarget.dataset.reply
    var reply = this.data.replies[idx]
    if (!reply || !reply.text || reply.text === '加载中...') {
      showToast('暂无内容可复制')
      return
    }
    copyToClipboard(reply.text, '已复制到剪贴板')
  },

  /** 换一种风格 — 跳转到联系人编辑页的回复风格模块 */
  replaceReply: function() {
    var self = this
    var contactId = self.data.currentContactId
    if (!contactId) {
      showToast('未找到联系人信息')
      return
    }
    wx.navigateTo({
      url: '/pages/contact-create/contact-create?id=' + contactId + '&scrollTo=style'
    })
  },

  /** 再生成 3 条 */
  regenerateReply: function() {
    var self = this
    var contactStyles = self.data.contactStyles || []
    var baseStyle = contactStyles[0] || '风格一'
    var sA = baseStyle
    var sB = contactStyles.length >= 2 ? contactStyles[1] : baseStyle
    var sC = contactStyles.length >= 2
      ? contactStyles[0] + '+' + contactStyles[1]
      : (contactStyles[0] ? contactStyles[0] + '+自然' : '风格一+自然')
    showLoading('正在生成新回复...')
    self._callAPI({ action: 'regenerate' }, function(data) {
      hideLoading()
      var newReplies = []
      if (Array.isArray(data)) {
        data.forEach(function(r) {
          newReplies.push({
            text: r.text || r.content || '',
            style: r.style || r.label || '',
            active: Number(r.active) || 2,
            good: Number(r.good) || 4,
            rhythm: r.rhythm || r.pace || ''
          })
        })
      } else if (data.replies && Array.isArray(data.replies)) {
        data.replies.forEach(function(r) {
          newReplies.push({
            text: r.text || r.content || '',
            style: r.style || r.label || '',
            active: Number(r.active) || 2,
            good: Number(r.good) || 4,
            rhythm: r.rhythm || r.pace || ''
          })
        })
      }
      // 如果没有 style 标签，用联系人的风格填充
      if (newReplies.length) {
        var labels = [sA, sB, sC]
        for (var i = 0; i < newReplies.length && i < 3; i++) {
          if (!newReplies[i].style) {
            newReplies[i].style = labels[i] || '自然'
          }
        }
        self.setData({ replies: newReplies })
        showToast('已生成新回复')
      } else {
        showToast('生成失败，请稍后再试')
      }
    }, function() {
      hideLoading()
      showToast('请求失败，请稍后再试')
    })
  },

  /** 切换风格（打开使用说明页） */
  switchStyle: function() {
    wx.navigateTo({ url: '/pages/usage/usage' })
  },

  /** 想换个内容试试 — 跳转回首页，恢复上次填写的所有表单数据 */
  switchToIndex: function() {
    var self = this
    // 把结果页缓存的上下文数据写回 storage，供首页 onShow 恢复
    wx.setStorageSync('__restore_index__', {
      message: self.data.currentMessage || '',
      context: self.data.currentContext || '',
      pace: self.data.currentPace || 25,
      selected_contact_id: self.data.currentContactId || ''
    })
    wx.switchTab({ url: '/pages/index/index' })
  },

  /** 调用后端 API */
  _callAPI: function(params, successCb, failCb) {
    var payload = {
      message: this.data.currentMessage || params.message || '',
      context: this.data.currentContext || params.context || '',
      pace: this.data.currentPace || params.pace || 25,
      contact_id: this.data.currentContactId || params.contact_id || null
    }

    // 如果是 replace 动作，带上上一条回复作为参考
    if (params.action === 'replace' && this.data.replies[0]) {
      payload.replace_text = this.data.replies[0].text
    }

    api.post('/analysis/generate', payload)
      .then(function(res) {
        if (res && res.data) {
          successCb(res.data)
        } else {
          failCb()
        }
      })
      .catch(function(err) {
        console.error('API 请求失败:', err)
        failCb()
      })
  }
})