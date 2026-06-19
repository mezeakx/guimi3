/**
 * 工具函数集合
 */

// 字数统计
function countChars(text) {
  if (!text) return 0
  return text.length
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

// 格式化相对时间
function formatRelativeTime(date) {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diff = now - target

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return formatDate(date)
}

// 防抖函数
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 深拷贝
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 显示 Toast
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title, icon, duration })
}

// 显示 Loading
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true })
}

// 隐藏 Loading
function hideLoading() {
  wx.hideLoading()
}

// 复制到剪贴板
function copyToClipboard(text, successMsg = '复制成功') {
  wx.setClipboardData({
    data: text,
    success: () => {
      wx.showToast({ title: successMsg, icon: 'success' })
    }
  })
}

// 判断字符串是否为空
function isEmpty(str) {
  return !str || str.trim().length === 0
}

module.exports = {
  countChars,
  formatDate,
  formatRelativeTime,
  debounce,
  deepClone,
  showToast,
  showLoading,
  hideLoading,
  copyToClipboard,
  isEmpty
}
