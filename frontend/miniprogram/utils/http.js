// API 请求封装
const config = require('../config/index')

// Mock 数据
var MOCK_ENABLED = true

var mockData = {
  thinking: '他主动找你聊天，并持续追问你的情况，大概率希望继续推进关系。',
  thinkingTags: ['对你有兴趣', '想继续话题', '期待你给出反馈'],
  remind: '不建议过于主动，把节奏放慢一点，先观察他的投入程度，保持轻松自然。',
  remindTags: ['不要立刻答应见面', '先继续聊天观察'],
  replies: [
    { text: '哈哈可以呀～不过我对那边不太熟，你有什么推荐吗？', style: '稳妥自然', active: 2, good: 4, rhythm: '自然' },
    { text: '听起来还不错～有机会可以一起去看看呀～', style: '提升好感', active: 3, good: 5, rhythm: '稍快' },
    { text: '怎么突然想约我啦～', style: '轻微拉扯', active: 1, good: 3, rhythm: '慢热' }
  ],
  message: '',
  context: '',
  pace: 25,
  contact_id: null
}

function request(apiUrl, method, data) {
  console.log('[http.request] apiUrl=' + apiUrl + ', method=' + method)
  
  if (MOCK_ENABLED) {
    console.log('[http.request] using MOCK mode')
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        try {
          var result = {
            success: true,
            data: JSON.parse(JSON.stringify(mockData))
          }
          console.log('[http.request] mock resolved')
          resolve(result)
        } catch (e) {
          console.error('[http.request] mock error:', e)
          reject(e)
        }
      }, 300)
    })
  }

  return new Promise((resolve, reject) => {
    var token = wx.getStorageSync('token')

    wx.request({
      url: config.baseUrl + apiUrl,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.redirectTo({ url: '/pages/index/index' })
          reject(new Error('登录已过期'))
        } else {
          console.error('请求失败 statusCode=' + res.statusCode)
          reject(new Error(res.data && res.data.message ? res.data.message : '请求失败'))
        }
      },
      fail: (err) => {
        console.error('请求网络失败:', err)
        reject(new Error('网络请求失败: ' + (err.errMsg || JSON.stringify(err))))
      }
    })
  })
}

function get(url, data) {
  return request(url, 'GET', data || {})
}

function post(url, data) {
  return request(url, 'POST', data || {})
}

// 上传文件
function upload(filePath, formData) {
  return new Promise((resolve, reject) => {
    var token = wx.getStorageSync('token')

    if (MOCK_ENABLED) {
      setTimeout(function() {
        resolve({ success: true, data: { url: 'mock://uploaded-image.jpg' } })
      }, 300)
      return
    }

    wx.uploadFile({
      url: config.baseUrl + '/upload',
      filePath: filePath,
      name: 'file',
      formData: formData || {},
      header: {
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success: (res) => {
        try {
          var data = JSON.parse(res.data)
          if (data.success) {
            resolve(data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

module.exports = {
  get: get,
  post: post,
  request: request,
  upload: upload,
  setMockEnabled: function(enabled) { MOCK_ENABLED = enabled },
  getMockEnabled: function() { return MOCK_ENABLED }
}
