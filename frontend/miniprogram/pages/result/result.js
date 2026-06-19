// pages/result/result.js
const { copyToClipboard, showToast } = require('../../utils/helpers')

Page({
  data: {
    replyA: '',
    replyB: '',
    replyC: '',
    boyIntent: '',
    riskWarning: '',
    rawData: null
  },

  onLoad(options) {
    if (options.data) {
      const data = JSON.parse(decodeURIComponent(options.data))
      this.setData({
        replyA: data.reply_A || '',
        replyB: data.reply_B || '',
        replyC: data.reply_C || '',
        boyIntent: data.boy_intent || '',
        riskWarning: data.risk_warning || '',
        rawData: data
      })
    }
  },

  copyReply(e) {
    const type = e.currentTarget.dataset.type
    const reply = this.data['reply' + type]
    if (reply) {
      copyToClipboard(reply)
    }
  },

  sharePoster() {
    // TODO: 生成分享海报
    showToast('分享功能开发中')
  }
})
