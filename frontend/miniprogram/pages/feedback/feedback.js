const { feedbackApi } = require('../../api/index')
const { showToast, showLoading, hideLoading } = require('../../utils/helpers')

Page({
  data: {
    content: '',
    image: '',
    contact: ''
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  uploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ image: res.tempFilePaths[0] })
      }
    })
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  onSubmit() {
    const { content } = this.data
    if (!content || content.trim().length === 0) {
      showToast('请输入反馈内容')
      return
    }

    showLoading('提交中...')
    feedbackApi.submit({
      content: content.trim(),
      contact: this.data.contact.trim(),
      image: this.data.image
    }).then(() => {
      hideLoading()
      showToast('反馈已提交，感谢你的意见！')
      this.setData({ content: '', image: '', contact: '' })
    }).catch(() => {
      hideLoading()
      showToast('提交失败，请稍后再试')
    })
  }
})
