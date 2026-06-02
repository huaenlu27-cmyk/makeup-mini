Page({
  data: { items: [] },
  onShow(){
    var items = wx.getStorageSync('cart') || []
    this.setData({ items: items })
  },
  clearCart(){
    wx.removeStorageSync('cart')
    this.setData({ items: [] })
    wx.showToast({ title: '已清空', icon: 'success' })
  },
  goChecklist(){
    wx.switchTab({ url: '/pages/checklist/checklist' })
  }
})
