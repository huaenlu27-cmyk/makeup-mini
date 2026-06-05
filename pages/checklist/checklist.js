var BUDGET_OPTIONS = ['全部价位', '平价 (< ¥100)', '中等 (¥100 - ¥299)', '高端 (¥300 +)']
var BUDGET_VALUES = ['all', 'low', 'mid', 'high']

var _fallbackCats = null
var _fallbackProds = null
try{ _fallbackCats = require('../../data/categories') }catch(e){}
try{ _fallbackProds = require('../../data/products') }catch(e){}

Page({
  data: {
    categories: { groups: [] },
    selectedCat: '',
    viewMode: 'swatch',
    budgetIndex: 0,
    budgetOptions: BUDGET_OPTIONS,
    swatches: [],
    brands: [],
    brandCounts: {},
    filteredCount: 0,
    expandedKey: '',
    collapsedGroups: {},
    filterBrand: '',
    expandedBrand: '',
    expandedBrandItems: [],
    searchKeyword: ''
  },
  onLoad(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    var cats = (app && app.globalData && app.globalData.categories) || _fallbackCats || { groups: [] }
    this.setData({ categories: cats, theme: theme })
    var firstGroup = cats.groups && cats.groups[0]
    var firstCat = firstGroup && firstGroup.items && firstGroup.items[0]
    if(firstCat) this.selectCategory(firstCat)
  },
  onShow(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._updateBadge()
  },
  _getProducts(){
    var app = getApp()
    return (app && app.globalData && app.globalData.products) || _fallbackProds || []
  },
  onToggleGroup(e){
    var gi = e.currentTarget.dataset.gi
    var obj = {}
    obj['collapsedGroups[' + gi + ']'] = !this.data.collapsedGroups[gi]
    this.setData(obj)
  },
  onSelectCategory(e){
    this.selectCategory(e.currentTarget.dataset.cat)
  },
  onSearchInput(e){
    var val = (e.detail.value || '').trim()
    this.setData({ searchKeyword: val })
    if(this.data.selectedCat) this.selectCategory(this.data.selectedCat)
  },
  onClearSearch(){
    this.setData({ searchKeyword: '' })
    if(this.data.selectedCat) this.selectCategory(this.data.selectedCat)
  },
  onBudgetChange(e){
    var idx = e.detail.value
    this.setData({ budgetIndex: idx })
    if(this.data.selectedCat) this.selectCategory(this.data.selectedCat)
  },
  selectCategory(cat){
    var budget = BUDGET_VALUES[this.data.budgetIndex]
    var keyword = this.data.searchKeyword
    var products = this._getProducts()
    var pool = products.filter(function(p){
      return p.category && cat && (p.category.indexOf(cat.split('/')[0]) > -1 || p.category === cat)
    })
    if(pool.length === 0){
      var kw = cat.split('/')[0]
      pool = products.filter(function(p){ return p.name && p.name.indexOf(kw) > -1 })
    }
    if(keyword){
      var kwLower = keyword.toLowerCase()
      pool = pool.filter(function(p){
        return (p.name && p.name.toLowerCase().indexOf(kwLower) > -1) ||
               (p.brand && p.brand.toLowerCase().indexOf(kwLower) > -1) ||
               (p.colorName && p.colorName.toLowerCase().indexOf(kwLower) > -1)
      })
    }
    if(budget !== 'all') pool = pool.filter(function(p){ return p.budget === budget })
    var map = {}
    pool.forEach(function(s){
      var key = s.colorName || '通用'
      if(!map[key]){
        map[key] = { name: key, hexes: [], items: [] }
      }
      if(s.hex && map[key].hexes.indexOf(s.hex) === -1){
        map[key].hexes.push(s.hex)
      }
      map[key].items.push(s)
    })
    var swatches = []
    var mapKeys = Object.keys(map)
    for(var i = 0; i < mapKeys.length; i++){
      var sw = map[mapKeys[i]]
      sw.visibleHexes = sw.hexes.slice(0, 5)
      sw.extraHexCount = sw.hexes.length > 5 ? sw.hexes.length - 5 : 0
      sw.showFallback = sw.hexes.length === 0
      swatches.push(sw)
    }
    var brandCounts = {}
    pool.forEach(function(s){ brandCounts[s.brand] = (brandCounts[s.brand] || 0) + 1 })
    var brands = Object.keys(brandCounts).sort()
    this.setData({
      selectedCat: cat,
      expandedKey: '',
      swatches: swatches,
      brands: brands,
      brandCounts: brandCounts,
      filteredCount: pool.length
    })
  },
  onViewBrand(e){
    var brand = e.currentTarget.dataset.brand
    var cat = this.data.selectedCat
    if(this.data.expandedBrand === brand){
      this.setData({ expandedBrand: '', expandedBrandItems: [] })
      return
    }
    var products = this._getProducts()
    var keyword = this.data.searchKeyword
    var pool = products.filter(function(p){
      return p.brand === brand && p.category && cat && (p.category.indexOf(cat.split('/')[0]) > -1 || p.category === cat)
    })
    if(pool.length === 0){
      var kw = cat.split('/')[0]
      pool = products.filter(function(p){ return p.brand === brand && p.name && p.name.indexOf(kw) > -1 })
    }
    if(keyword){
      var kwLower = keyword.toLowerCase()
      pool = pool.filter(function(p){
        return (p.name && p.name.toLowerCase().indexOf(kwLower) > -1) ||
               (p.brand && p.brand.toLowerCase().indexOf(kwLower) > -1) ||
               (p.colorName && p.colorName.toLowerCase().indexOf(kwLower) > -1)
      })
    }
    var budget = BUDGET_VALUES[this.data.budgetIndex]
    if(budget !== 'all') pool = pool.filter(function(p){ return p.budget === budget })
    this.setData({ expandedBrand: brand, expandedBrandItems: pool })
  },
  onTapSwatch(e){
    var key = e.currentTarget.dataset.key
    var expanded = this.data.expandedKey === key ? '' : key
    this.setData({ expandedKey: expanded })
    if(expanded){
      var swatches = this.data.swatches
      for(var i = 0; i < swatches.length; i++){
        if(swatches[i].name === expanded){
          var items = swatches[i].items || []
          for(var j = 0; j < items.length; j++){
            this._addRecentView(items[j].id)
          }
          break
        }
      }
    }
  },
  _addRecentView(id){
    var views = wx.getStorageSync('recentViews') || []
    var filtered = []
    for(var i = 0; i < views.length; i++){
      if(views[i] !== id) filtered.push(views[i])
    }
    filtered.unshift(id)
    if(filtered.length > 20) filtered = filtered.slice(0, 20)
    wx.setStorageSync('recentViews', filtered)
  },
  onAddToCart(e){
    var id = e.currentTarget.dataset.id
    this._addRecentView(id)
    var sku = null
    var swatches = this.data.swatches
    for(var i = 0; i < swatches.length; i++){
      var items = swatches[i].items || []
      for(var j = 0; j < items.length; j++){
        if(items[j].id === id){ sku = items[j]; break }
      }
      if(sku) break
    }
    if(!sku){
      var brandItems = this.data.expandedBrandItems || []
      for(var i = 0; i < brandItems.length; i++){
        if(brandItems[i].id === id){ sku = brandItems[i]; break }
      }
    }
    if(!sku){
      wx.showToast({ title: '未找到商品', icon: 'none' })
      return
    }
    var cart = wx.getStorageSync('cart') || []
    for(var c = 0; c < cart.length; c++){
      if(cart[c].id === id){
        wx.showToast({ title: '已在清单中', icon: 'none' })
        return
      }
    }
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    this._updateBadge()
    wx.showToast({ title: '已加入清单', icon: 'success' })
  },
  _updateBadge(){
    var cart = wx.getStorageSync('cart') || []
    var count = cart.length
    wx.setTabBarBadge({ index: 2, text: count > 99 ? '99+' : String(count) })
  },
  setViewMode(e){
    this.setData({ viewMode: e.currentTarget.dataset.mode, expandedKey: '' })
  },
  goCart(){
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
