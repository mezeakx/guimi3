const { getIdentityAvatarPath } = require('../../utils/identity-avatar')
// pages/contact-create/contact-create.js
const { showToast, isEmpty } = require('../../utils/helpers')

// 联系人身份选项 - 添加 emoji 图标
const identities = [
  { label: '现实情侣', value: 'reality_couple', icon: '💑' },
  { label: '暗恋对象', value: 'crush', icon: '💕' },
  { label: '暧昧对象', value: 'ambiguous', icon: '💭' },
  { label: '追求者', value: 'pursuer', icon: '🌹' },
  { label: '男神', value: 'god', icon: '✨' },
  { label: '相亲对象', value: 'blind_date', icon: '🤝' },
  { label: '网恋对象', value: 'online_lover', icon: '🌐' },
  { label: '约会对象', value: 'dating', icon: '☕' },
  { label: '前任', value: 'ex', icon: '💔' },
  { label: '饭搭子', value: 'meal_partner', icon: '🍜' },
  { label: '好朋友', value: 'good_friend', icon: '👫' },
  { label: '普通朋友', value: 'friend', icon: '😊' },
  { label: '发小', value: 'childhood_friend', icon: '🤜' },
  { label: '同学', value: 'classmate', icon: '👕' },
  { label: '家里介绍', value: 'family_introduce', icon: '🏠' },
  { label: '同事', value: 'colleague', icon: '💼' },
  { label: '上司', value: 'boss', icon: '👔' },
  { label: '客户', value: 'client', icon: '📋' },
  { label: '网友', value: 'netizen', icon: '💻' },
  { label: '游戏搭子', value: 'game_partner', icon: '🎮' },
  { label: '想拒绝的人', value: 'unwanted', icon: '🚫' },
  { label: '大佬', value: 'senior', icon: '🌟' },
  { label: '年上', value: 'older', icon: '🤵' },
  { label: '年下', value: 'younger', icon: '🧒' }
]

// 年上和年下是互斥组
const MUTEX_GROUP = ['good_friend', 'friend', 'older', 'younger']

// 多选最大数量
const MAX_IDENTITIES = 4
const MAX_TARGETS = 1

const targets = [
  { label: '先了解他', value: '了解', icon: '🔍' },
  { label: '提升好感', value: 'flirt', icon: '💖' },
  { label: '保持暧昧', value: 'ambiguous', icon: '💫' },
  { label: '让他主动', value: 'proactive', icon: '🎯' },
  { label: '保持朋友', value: 'friend', icon: '🤗' },
  { label: '委婉拒绝', value: 'reject', icon: '🙅' }
]

Page({
  data: {
    editId: null,
    nickname: '',
    selectedIdentities: [],
    selectedIdentityMap: {},
    maxIdentities: MAX_IDENTITIES,
    identities: identities,
    selectedTargets: [],
    selectedTargetMap: {},
    maxTargets: MAX_TARGETS,
    targets: targets
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value.substring(0, 20) })
  },

  /**
   * 选择身份（多选，最多4个；年上/年下互斥）
   */
  selectIdentity(e) {
    const value = e.currentTarget.dataset.value
    const selected = this.data.selectedIdentities.slice()
    const identityMap = Object.assign({}, this.data.selectedIdentityMap)

    // 判断是否已选中
    const isSelected = identityMap[value] === true
    const index = selected.indexOf(value)

    // 如果点击的是年上或年下，处理互斥逻辑
    if (MUTEX_GROUP.includes(value)) {
      if (isSelected) {
        // 取消选中：移除该项
        selected.splice(index, 1)
        delete identityMap[value]
      } else {
        // 选中：先移除互斥项，再添加当前项
        const newSelected = []
        const newMap = {}
        selected.forEach(function(v) {
          if (!MUTEX_GROUP.includes(v)) {
            newSelected.push(v)
            newMap[v] = true
          }
        })
        // 检查数量上限
        if (newSelected.length >= MAX_IDENTITIES) {
          showToast('最多选择4个身份')
          return
        }
        newSelected.push(value)
        newMap[value] = true
        this.setData({
          selectedIdentities: newSelected,
          selectedIdentityMap: newMap
        })
        return
      }
    } else {
      // 普通选项：正常多选/取消
      if (isSelected) {
        selected.splice(index, 1)
        delete identityMap[value]
      } else {
        // 已达上限，不允许继续选
        if (selected.length >= MAX_IDENTITIES) {
          showToast('最多选择4个身份')
          return
        }
        selected.push(value)
        identityMap[value] = true
      }
    }

    this.setData({
      selectedIdentities: selected,
      selectedIdentityMap: identityMap
    })
  },

  /**
   * 选择回复目标（单选，有且只能选择一个，可取消）
   */
  selectTarget(e) {
    const value = e.currentTarget.dataset.value
    const selected = this.data.selectedTargets.slice()
    const targetMap = Object.assign({}, this.data.selectedTargetMap)

    // 判断是否已选中
    const isSelected = targetMap[value] === true

    if (isSelected) {
      // 取消选中
      selected.length = 0
      for (const key in targetMap) {
        delete targetMap[key]
      }
    } else {
      // 清空之前的选择，设置新的
      selected.length = 0
      for (const key in targetMap) {
        delete targetMap[key]
      }
      selected.push(value)
      targetMap[value] = true
    }

    this.setData({
      selectedTargets: selected,
      selectedTargetMap: targetMap
    })
  },

  onLoad(options) {
    if (options.id) {
      const contacts = wx.getStorageSync('contacts') || [];
      const contact = contacts.find(c => String(c.id) === String(options.id));
      if (!contact) {
        wx.showToast({ title: '联系人不存在', icon: 'none' });
        wx.navigateBack();
        return;
      }
      const selectedIdentities = contact.identities || (contact.identity_label ? [contact.identity_label] : []);
      const selectedTargets = contact.target || [];
      const identityMap = {};
      selectedIdentities.forEach(function(v) { identityMap[v] = true; });
      const targetMap = {};
      selectedTargets.forEach(function(v) { targetMap[v] = true; });
      this.setData({
        editId: contact.id,
        nickname: contact.nickname || '',
        selectedIdentities: selectedIdentities,
        selectedIdentityMap: identityMap,
        selectedTargets: selectedTargets,
        selectedTargetMap: targetMap
      });
    }
  },


  onShow() {
    // 获取当前页面的参数 - 简化版本
    console.log('onShow called, options:', this.options);

    // 如果有ID参数，加载联系人数据进行编辑
    if (this.options && this.options.id) {
      try {
        const contacts = wx.getStorageSync('contacts') || [];
        console.log('Loaded contacts from storage:', contacts.length);
        
        const contact = contacts.find(c => String(c.id) === String(this.options.id));
        console.log('Found contact:', contact);
        
        if (contact) {
          // 提取身份信息
          let selectedIdentities = [];
          if (contact.identities && Array.isArray(contact.identities)) {
            selectedIdentities = contact.identities;
          } else if (contact.identity_label) {
            selectedIdentities = [contact.identity_label];
          }
          
          // 提取目标
          const selectedTargets = contact.target || [];
          
          // 创建映射对象
          const identityMap = {};
          selectedIdentities.forEach(function(v) { identityMap[v] = true; });
          
          const targetMap = {};
          selectedTargets.forEach(function(v) { targetMap[v] = true; });
          
          // 更新页面数据
          this.setData({
            editId: contact.id,
            nickname: contact.nickname || '',
            selectedIdentities: selectedIdentities,
            selectedIdentityMap: identityMap,
            selectedTargets: selectedTargets,
            selectedTargetMap: targetMap
          });
          
          console.log('Contact data loaded successfully for editing');
        } else {
          console.warn('Contact not found for ID:', this.options.id);
        }
      } catch (error) {
        console.error('Error loading contact data:', error);
      }
    }
  },

  saveContact() {
    const { nickname, selectedIdentities, selectedTargets } = this.data

    if (isEmpty(nickname)) {
      showToast('请输入联系人昵称')
      return
    }
    if (selectedIdentities.length === 0) {
      showToast('请选择他的身份')
      return
    }
    if (selectedTargets.length === 0) {
      showToast('请选择回复目标')
      return
    }

    // 校验昵称重复
    const contacts = wx.getStorageSync('contacts') || []
    const existIndex = contacts.findIndex(c => c.nickname === nickname && String(c.id) !== String(this.data.editId))
    if (existIndex >= 0) {
      showToast('该联系人已存在')
      return
    }

    // 获取选中身份的标签
    const labels = selectedIdentities.map(v => {
      const item = this.data.identities.find(i => i.value === v)
      return item ? item.label : v
    })

    // 获取选中目标的标签
    const targetLabels = selectedTargets.map(v => {
      const item = this.data.targets.find(i => i.value === v)
      return item ? item.label : v
    })

    const contactData = {
      nickname,
      identities: selectedIdentities,
      identity_labels: labels,
      target: selectedTargets,
      target_labels: targetLabels,
      avatar: getIdentityAvatarPath(selectedIdentities)
    }

    if (this.data.editId) {
      const existIndex = contacts.findIndex(c => String(c.id) === String(this.data.editId))
      if (existIndex >= 0) {
        contacts[existIndex] = Object.assign({}, contacts[existIndex], contactData)
        wx.setStorageSync('contacts', contacts)

        const recent = wx.getStorageSync('recent_contacts') || []
        const existRecentIndex = recent.findIndex(c => String(c.id) === String(this.data.editId))
        if (existRecentIndex >= 0) recent.splice(existRecentIndex, 1)
        recent.unshift(contacts[existIndex])
        wx.setStorageSync('recent_contacts', recent.slice(0, 4))

        showToast('修改成功')
      }
    } else {
      const newContact = Object.assign({ id: String(Date.now()) }, contactData)
      contacts.unshift(newContact)
      wx.setStorageSync('contacts', contacts)

      const recent = wx.getStorageSync('recent_contacts') || []
      const existRecentIndex = recent.findIndex(c => String(c.id) === String(newContact.id))
      if (existRecentIndex >= 0) recent.splice(existRecentIndex, 1)
      recent.unshift(newContact)
      wx.setStorageSync('recent_contacts', recent.slice(0, 4))

      showToast('联系人保存成功')
    }
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
