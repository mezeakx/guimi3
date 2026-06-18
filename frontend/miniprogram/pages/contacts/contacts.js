// pages/contacts/contacts.js
Page({
  data: {
    contacts: [],
    showDrawer: false,
    statusBarHeight: 0,
    newContact: {
      nickname: '',
      identity_label: ''
    },
    // FAB 拖拽相关
    fabRight: 38,
    fabBottom: 0,
    fabDragging: false,
    fabInitialRight: 38,
    fabInitialBottom: 128
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 });
    // 初始化 FAB 位置为右下角
    this.setData({
      fabRight: 38,
      fabBottom: 128
    });
  },

  onShow() {
    this.loadContacts();
  },

  loadContacts() {
    const contacts = wx.getStorageSync('contacts') || [];
    // 兼容旧数据并格式化身份标签
    const processed = contacts.map(function(item) {
      let labels = []
      if (item.identity_labels && Array.isArray(item.identity_labels)) {
        labels = item.identity_labels
      } else if (item.identity_label) {
        labels = [item.identity_label]
      }
      item.identity_label_display = labels.join(', ')
      return item
    })
    this.setData({ contacts: processed });
  },

  // ========== 抽屉功能 ==========
  toggleDrawer() {
    const showDrawer = !this.data.showDrawer;
    this.setData({ showDrawer });
  },

  // ========== 表单输入 ==========
  onNicknameInput(e) {
    this.setData({
      'newContact.nickname': e.detail.value
    });
  },

  onIdentityInput(e) {
    this.setData({
      'newContact.identity_label': e.detail.value
    });
  },

  // ========== 提交联系人 ==========
  submitContact() {
    const { nickname, identity_label } = this.data.newContact;

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入联系人姓名', icon: 'none' });
      return;
    }

    const contacts = this.data.contacts;
    const newContact = {
      id: Date.now().toString(),
      nickname: nickname.trim(),
      identity_label: identity_label.trim() || '未知关系',
      avatar: '',
      created_at: new Date().toISOString()
    };

    contacts.unshift(newContact);
    wx.setStorageSync('contacts', contacts);

    // 重置表单
    this.setData({
      contacts,
      newContact: { nickname: '', identity_label: '' }
    });

    // 关闭抽屉
    this.toggleDrawer();
    wx.showToast({ title: '添加成功', icon: 'success' });
  },

  // ========== 页面跳转 ==========
  goToCreate() {
    wx.navigateTo({ url: '/pages/contact-create/contact-create' });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/contact-detail/contact-detail?id=${id}` });
  },

  // ========== 删除联系人 ==========
  deleteContact(e) {
    const id = String(e.currentTarget.dataset.id);
    const contact = this.data.contacts.find(c => String(c.id) === id);
    if (!contact) return;

    wx.showModal({
      title: '删除联系人',
      content: `确定要删除"${contact.nickname}"吗？删除后将无法恢复。`,
      confirmColor: '#ff5d93',
      success: (res) => {
        if (res.confirm) this._doDelete(id);
      }
    });
  },

  _doDelete(id) {
    const contacts = this.data.contacts
      .map(c => ({ ...c, id: String(c.id) }))
      .filter(c => c.id !== id);
    wx.setStorageSync('contacts', contacts);
    this.setData({ contacts });

    // 同步从最近联系人中删除
    const recent = wx.getStorageSync('recent_contacts') || [];
    const filteredRecent = recent
      .map(c => ({ ...c, id: String(c.id) }))
      .filter(c => c.id !== id);
    wx.setStorageSync('recent_contacts', filteredRecent);

    wx.showToast({ title: '已删除', icon: 'success' });
  },

  // ========== FAB 拖拽功能 ==========

  /**
   * 触摸开始：记录初始触摸位置，进入拖拽状态
   */
  onFabTouchStart(e) {
    const touch = e.touches[0];
    this.setData({
      fabDragging: true
    });
    // 记录初始触摸坐标
    this._fabTouchStartX = touch.clientX;
    this._fabTouchStartY = touch.clientY;
    // 记录 FAB 初始位置（相对于右下角）
    this._fabStartRight = this.data.fabRight;
    this._fabStartBottom = this.data.fabBottom;
  },

  /**
   * 触摸移动：实时计算偏移量，更新 FAB 位置
   */
  onFabTouchMove(e) {
    if (!this.data.fabDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this._fabTouchStartX;
    const deltaY = touch.clientY - this._fabTouchStartY;

    // 计算新位置
    let newRight = this._fabStartRight + deltaX;
    let newBottom = this._fabStartBottom - deltaY;

    // 获取屏幕尺寸，限制 FAB 不超出边界
    const sysInfo = wx.getSystemInfoSync();
    const screenWidth = sysInfo.windowWidth;
    const screenHeight = sysInfo.windowHeight;
    const fabSize = 48; // FAB 半径约 48px = 96rpx / 2

    // 限制水平范围：0 ~ 屏幕宽度 - FAB尺寸
    newRight = Math.max(0, Math.min(newRight, screenWidth - fabSize * 2));
    // 限制垂直范围：0 ~ 屏幕高度 - FAB尺寸
    newBottom = Math.max(0, Math.min(newBottom, screenHeight - fabSize * 2));

    this.setData({
      fabRight: newRight,
      fabBottom: newBottom
    });
  },

  /**
   * 触摸结束：退出拖拽状态
   */
  onFabTouchEnd() {
    this.setData({
      fabDragging: false
    });
  }
});