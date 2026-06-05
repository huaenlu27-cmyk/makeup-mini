try{ var hotStats = require('../../utils/hotStats') }catch(e){}

Page({
  data: {
    products: [],
    categories: [],
    colorGroups: [],
    category: '',
    selectedColor: null
  },
  onLoad() {
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || []
    if(!prods.length){
      try{ prods = require('../../data/products') }catch(e){ prods = [] }
    }
    var cats = Array.from(new Set(prods.map(function(p){ return p.category }))).sort()
    var theme = (app && app.globalData && app.globalData.theme) ? app.globalData.theme : null
    if(!theme){ try{ theme = require('../../theme') }catch(e){ theme = null } }
    this.setData({ products: prods, categories: cats, category: cats[0]||'', theme: theme }, function(){
      this.buildColorGroups()
    })
  },
  buildColorGroups() {
    const { products, category } = this.data
    const skusInCategory = products.filter(s=> !category || s.category===category)
    const map = {}
    skusInCategory.forEach(s=>{
      const key = s.hex || s.colorName || '通用'
      if(!map[key]) map[key] = { colorName: s.colorName, hex: s.hex, items: [] }
      map[key].items.push(s)
    })
    const groups = Object.values(map)
    this.setData({ colorGroups: groups })
  },
  onSetCategory(e){
    const c = e.currentTarget.dataset.cat
    this.setData({ category: c, selectedColor: null }, ()=> this.buildColorGroups())
  },
  onSelectColor(e){
    const hex = e.currentTarget.dataset.hex
    const name = e.currentTarget.dataset.name
    const found = this.data.colorGroups.find(g=> (g.hex||g.colorName) === (hex||name))
    this.setData({ selectedColor: found || null })
  },
  onAddToCart(e){
    const id = e.currentTarget.dataset.id
    const sku = this.data.products.find(p=> p.id===id)
    if(!sku) return
    var cart = wx.getStorageSync('cart')||[]
    for(var c = 0; c < cart.length; c++){
      if(cart[c].id === id){
        wx.showToast({ title: '已在清单中', icon: 'none' })
        return
      }
    }
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    this._updateBadge()
    if(hotStats) hotStats.addHotStat(id)
    wx.showToast({ title: '已加入清单', icon: 'success' })
  },
  _updateBadge(){
    var cart = wx.getStorageSync('cart') || []
    wx.setTabBarBadge({ index: 2, text: cart.length > 99 ? '99+' : String(cart.length) })
  }
})
