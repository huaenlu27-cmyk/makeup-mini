var cfg = require('../../data/config')
var CAT_ORDER = cfg.CAT_ORDER

function _themeStyles(t){
  if(!t || !t.colors) return {}
  var c = t.colors
  return { bg:c.primaryBg, surface:c.surface, text:c.text, muted:c.muted, accent:c.accent, accentL:c.accentLight, border:c.border, chipBg:c.chipBg }
}

Page({
  data: { items: [], groups: [], totalPrice: 0 },
  onShow(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme, s: _themeStyles(theme) })
    var items = wx.getStorageSync('cart') || []
    var groups = this._groupItems(items)
    var total = 0
    for(var i = 0; i < items.length; i++){
      total += Number(items[i].price) || 0
    }
    this.setData({ items: items, groups: groups, totalPrice: total.toFixed(2) })
    this._updateBadge()
  },
  _groupItems(items){
    var map = {}
    for(var i = 0; i < items.length; i++){
      var cat = items[i].category || '其他'
      if(!map[cat]) map[cat] = []
      map[cat].push(items[i])
    }
    var groups = []
    for(var c = 0; c < CAT_ORDER.length; c++){
      var cat = CAT_ORDER[c]
      if(map[cat] && map[cat].length > 0){
        groups.push({ title: cat, items: map[cat] })
      }
    }
    for(var key in map){
      if(CAT_ORDER.indexOf(key) === -1){
        groups.push({ title: key, items: map[key] })
      }
    }
    return groups
  },
  onTapItem(e){
    var id = e.currentTarget.dataset.id
    var items = this.data.items
    var item = null
    for(var i = 0; i < items.length; i++){
      if(items[i].id === id){ item = items[i]; break }
    }
    if(!item) return
    var keyword = item.brand + ' ' + item.name
    var self = this
    wx.showActionSheet({
      itemList: ['淘宝搜索', '拼多多搜索', '京东搜索'],
      success(res){
        if(res.tapIndex === 0){
          wx.setClipboardData({
            data: keyword,
            success(){ wx.showToast({ title: '已复制，去淘宝粘贴搜索', icon: 'none' }) }
          })
        } else if(res.tapIndex === 1){
          wx.setClipboardData({
            data: keyword,
            success(){
              wx.navigateToMiniProgram({
                appId: 'wx32540bd863b27570',
                success(){ wx.showToast({ title: '已复制，正在打开拼多多', icon: 'none' }) },
                fail(){ wx.showToast({ title: '打开拼多多失败', icon: 'none' }) }
              })
            }
          })
        } else if(res.tapIndex === 2){
          wx.setClipboardData({
            data: keyword,
            success(){
              wx.navigateToMiniProgram({
                appId: 'wx91d27dbf599dff74',
                success(){ wx.showToast({ title: '已复制，正在打开京东', icon: 'none' }) },
                fail(){ wx.showToast({ title: '打开京东失败', icon: 'none' }) }
              })
            }
          })
        }
      }
    })
  },
  onRemoveItem(e){
    var id = e.currentTarget.dataset.id
    var items = wx.getStorageSync('cart') || []
    var removed = false
    for(var i = 0; i < items.length; i++){
      if(items[i].id === id){
        items.splice(i, 1)
        removed = true
        break
      }
    }
    if(!removed) return
    wx.setStorageSync('cart', items)
    var groups = this._groupItems(items)
    var total = 0
    for(var i = 0; i < items.length; i++){
      total += Number(items[i].price) || 0
    }
    this.setData({ items: items, groups: groups, totalPrice: total.toFixed(2) })
    this._updateBadge()
    wx.showToast({ title: '已移除', icon: 'success' })
  },
  clearCart(){
    var self = this
    wx.showModal({
      title: '确认清空',
      content: '确定要清空清单中的所有商品吗？',
      success(res){
        if(res.confirm){
          wx.removeStorageSync('cart')
          self.setData({ items: [], groups: [], totalPrice: '0.00' })
          self._updateBadge()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },
  goChecklist(){
    wx.switchTab({ url: '/pages/checklist/checklist' })
  },
  _updateBadge(){
    var cart = wx.getStorageSync('cart') || []
    wx.setTabBarBadge({ index: 2, text: cart.length > 99 ? '99+' : String(cart.length) })
  }
})
