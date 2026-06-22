// components/custom-tabbar/custom-tabbar.js
Component({
  data: {
    currentTab: 0,
    pages: ['/pages/index/index', '/pages/contacts/contacts', '/pages/profile/profile']
  },

  attached() {
    this._updateTab()
  },

  methods: {
    _updateTab() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const currentRoute = currentPage ? currentPage.route : ''
      const index = this.data.pages.indexOf(currentRoute)
      this.setData({ currentTab: index >= 0 ? index : 0 })
    },

    switchTab(e) {
      const index = parseInt(e.currentTarget.dataset.index)
      const page = this.data.pages[index]
      if (page) {
        wx.switchTab({ url: page })
      }
    }
  }
})
