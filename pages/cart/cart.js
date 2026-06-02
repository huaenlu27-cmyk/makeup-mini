Page({
  data: { items: [] },
  onLoad(){
    const app = getApp()
    let theme = (app && app.globalData && app.globalData.theme) ? app.globalData.theme : null
    if(!theme){ try{ theme = require('../../theme') }catch(e){ theme = null } }
    if(theme) this.setData({ theme })
  },
  onShow(){
    const items = wx.getStorageSync('cart')||[]
    this.setData({ items })
  },
  clearCart(){
    wx.removeStorageSync('cart')
    this.setData({ items: [] })
    wx.showToast({ title: '已清空', icon: 'success' })
  }
})
