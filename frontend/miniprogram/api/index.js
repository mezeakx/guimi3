// API 请求封装
const http = require('../utils/http')

// 认证相关
const authApi = {
  login(code) {
    return http.post('/auth/login', { code })
  },
  getUserInfo() {
    return http.get('/user/info')
  }
}

// 联系人相关
const contactApi = {
  getList() {
    return http.get('/contact/list')
  },
  create(data) {
    return http.post('/contact/create', data)
  },
  update(id, data) {
    return http.post('/contact/update/' + id, data)
  },
  delete(id) {
    return http.post('/contact/delete/' + id)
  },
  getDetail(id) {
    return http.get('/contact/detail/' + id)
  }
}

// AI 分析相关
const analysisApi = {
  generate(data) {
    return http.post('/analysis/generate', data)
  },
  getHistory(page = 1, pageSize = 10) {
    return http.get('/analysis/history?page=' + page + '&pageSize=' + pageSize)
  },
  clearHistory() {
    return http.post('/analysis/clear-history')
  }
}

// OCR 相关
const ocrApi = {
  recognize(imagePath) {
    return http.upload('/ocr/recognize', { image: imagePath })
  }
}

// 反馈相关
const feedbackApi = {
  submit(data) {
    return http.post('/feedback/submit', data)
  }
}

// 广告相关
const adApi = {
  watchAd() {
    return http.post('/ad/watch')
  }
}

module.exports = {
  authApi,
  contactApi,
  analysisApi,
  ocrApi,
  feedbackApi,
  adApi
}
