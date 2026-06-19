// API 请求封装
const config = require('../config/index')

function request(apiUrl, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    wx.request({
      url: config.baseUrl + apiUrl,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.redirectTo({ url: '/pages/index/index' })
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

function get(url, data = {}) {
  return request(url, 'GET', data)
}

function post(url, data = {}) {
  return request(url, 'POST', data)
}

// 上传文件
function upload(filePath, formData = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token')

    wx.uploadFile({
      url: config.baseUrl + '/upload',
      filePath: filePath,
      name: 'file',
      formData: formData,
      header: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
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
  get,
  post,
  request,
  upload
}
