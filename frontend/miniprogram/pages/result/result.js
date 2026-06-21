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
    replies: [
      { text: '', style: '稳妥自然', active: 2, good: 4, rhythm: '自然' },
      { text: '', style: '提升好感', active: 3, good: 5, rhythm: '稍快' },
      { text: '', style: '轻微拉扯', active: 1, good: 3, rhythm: '慢热' }
    ],
    // 原始数据
    rawData: null,
    // 当前使用的消息上下文
    currentMessage: '',
    currentContext: '',
    currentPace: 25,
    currentContactId: null
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
      // 旧格式兼容
      replies.push({
        text: data.reply_A || '',
        style: data.style_A || '稳妥自然',
        active: Number(data.active_A) || 2,
        good: Number(data.good_A) || 4,
        rhythm: data.rhythm_A || '自然'
      })
      replies.push({
        text: data.reply_B || '',
        style: data.style_B || '提升好感',
        active: Number(data.active_B) || 3,
        good: Number(data.good_B) || 5,
        rhythm: data.rhythm_B || '稍快'
      })
      replies.push({
        text: data.reply_C || '',
        style: data.style_C || '轻微拉扯',
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
      currentContactId: data.contact_id || null
    })
  },

  /** 设置默认回复占位 */
  _setDefaultReplies: function() {
    this.setData({
      replies: [
        { text: '加载中...', style: '稳妥自然', active: 2, good: 4, rhythm: '自然' },
        { text: '加载中...', style: '提升好感', active: 3, good: 5, rhythm: '稍快' },
        { text: '加载中...', style: '轻微拉扯', active: 1, good: 3, rhythm: '慢热' }
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

  /** 换一种回复（基于相同上下文重新生成 3 条） */
  replaceReply: function() {
    var self = this
    showLoading('换一种回复中...')
    self._callAPI({ action: 'replace' }, function(data) {
      hideLoading()
      // 合并新回复到第一条
      var newReply = {
        text: data.text || data.content || '换种说法试试？',
        style: data.style || '另一种风格',
        active: Number(data.active) || 2,
        good: Number(data.good) || 3,
        rhythm: data.rhythm || '自然'
      }
      var replies = self.data.replies.slice()
      replies[0] = newReply
      self.setData({ replies: replies })
      showToast('已更换回复')
    }, function() {
      hideLoading()
      showToast('请求失败，请稍后再试')
    })
  },

  /** 再生成 3 条 */
  regenerateReply: function() {
    var self = this
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
      if (newReplies.length) {
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