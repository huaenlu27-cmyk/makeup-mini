let products = []
try{
  products = require('../../data/products')
}catch(e){
  try{ products = require('../../data/products.json') }catch(e2){ products = [] }
}

Page({
  data: {
    products: [],
    categories: [],
    colorGroups: [],
    category: '',
    selectedColor: null
  },
  onLoad() {
    const prods = products || []
    const cats = Array.from(new Set(prods.map(p=>p.category))).sort()
    const app = getApp()
    let theme = (app && app.globalData && app.globalData.theme) ? app.globalData.theme : null
    if(!theme){ try{ theme = require('../../theme') }catch(e){ theme = null } }
    this.setData({ products: prods, categories: cats, category: cats[0]||'', theme }, ()=>{
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
    const cart = wx.getStorageSync('cart')||[]
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入清单', icon: 'success' })
  }
})
