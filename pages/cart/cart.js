var CAT_ORDER = ['隔离/妆前乳','粉底液/气垫','粉饼/散粉','眼影','眼线','睫毛膏','腮红','修容/修颜','高光','口红/唇釉','遮瑕','眉笔/眉粉/染眉']

Page({
  data: { items: [], groups: [] },
  onShow(){
    var items = wx.getStorageSync('cart') || []
    var groups = this._groupItems(items)
    this.setData({ items: items, groups: groups })
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
  clearCart(){
    wx.removeStorageSync('cart')
    this.setData({ items: [], groups: [] })
    wx.showToast({ title: '已清空', icon: 'success' })
  },
  goChecklist(){
    wx.switchTab({ url: '/pages/checklist/checklist' })
  }
})
