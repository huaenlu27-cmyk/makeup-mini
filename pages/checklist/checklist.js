var BUDGET_OPTIONS = ['全部价位', '平价 (< ¥100)', '中等 (¥100 - ¥299)', '高端 (¥300 +)']
var BUDGET_VALUES = ['all', 'low', 'mid', 'high']

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
    expandedBrandItems: []
  },
  onLoad(){
    var app = getApp()
    var cats = (app && app.globalData && app.globalData.categories) || { groups: [] }
    this.setData({ categories: cats })
    var firstGroup = cats.groups && cats.groups[0]
    var firstCat = firstGroup && firstGroup.items && firstGroup.items[0]
    if(firstCat) this.selectCategory(firstCat)
  },
  _getProducts(){
    var app = getApp()
    return (app && app.globalData && app.globalData.products) || []
  },
  onToggleGroup(e){
    var gi = e.currentTarget.dataset.gi
    var obj = {}
    obj['collapsedGroups[' + gi + ']'] = !this.data.collapsedGroups[gi]
    this.setData(obj)
  },
  onSelectCategory(e){
    this.setData({ expandedKey: '' })
    this.selectCategory(e.currentTarget.dataset.cat)
  },
  onBudgetChange(e){
    var idx = e.detail.value
    this.setData({ budgetIndex: idx, expandedKey: '' })
    if(this.data.selectedCat) this.selectCategory(this.data.selectedCat)
  },
  selectCategory(cat){
    this.setData({ selectedCat: cat, viewMode: 'swatch', filterBrand: '' })
    var budget = BUDGET_VALUES[this.data.budgetIndex]
    var products = this._getProducts()
    var pool = products.filter(function(p){
      return p.category && cat && (p.category.indexOf(cat.split('/')[0]) > -1 || p.category === cat)
    })
    if(pool.length === 0){
      var keyword = cat.split('/')[0]
      pool = products.filter(function(p){ return p.name && p.name.indexOf(keyword) > -1 })
    }
    if(budget !== 'all') pool = pool.filter(function(p){ return p.budget === budget })
    this._applyFilter(pool)
  },
  onViewBrand(e){
    var brand = e.currentTarget.dataset.brand
    var cat = this.data.selectedCat
    if(this.data.expandedBrand === brand){
      this.setData({ expandedBrand: '', expandedBrandItems: [] })
      return
    }
    var products = this._getProducts()
    var pool = products.filter(function(p){
      return p.brand === brand && p.category && cat && (p.category.indexOf(cat.split('/')[0]) > -1 || p.category === cat)
    })
    if(pool.length === 0){
      var keyword = cat.split('/')[0]
      pool = products.filter(function(p){ return p.brand === brand && p.name && p.name.indexOf(keyword) > -1 })
    }
    var budget = BUDGET_VALUES[this.data.budgetIndex]
    if(budget !== 'all') pool = pool.filter(function(p){ return p.budget === budget })
    this.setData({ expandedBrand: brand, expandedBrandItems: pool })
  },
  _applyFilter(pool){
    var map = {}
    pool.forEach(function(s){
      var key = s.hex || s.colorName || '通用'
      if(!map[key]) map[key] = { name: s.colorName || '通用', hex: s.hex || '#f4f4f4', items: [] }
      map[key].items.push(s)
    })
    var swatches = []
    var mapKeys = Object.keys(map)
    for(var i = 0; i < mapKeys.length; i++){
      swatches.push(map[mapKeys[i]])
    }
    var brandCounts = {}
    pool.forEach(function(s){ brandCounts[s.brand] = (brandCounts[s.brand] || 0) + 1 })
    var brands = Object.keys(brandCounts).sort()
    this.setData({
      swatches: swatches,
      brands: brands,
      brandCounts: brandCounts,
      filteredCount: pool.length
    })
  },
  onTapSwatch(e){
    var key = e.currentTarget.dataset.key
    var expanded = this.data.expandedKey === key ? '' : key
    this.setData({ expandedKey: expanded })
    if(expanded){
      var swatches = this.data.swatches
      for(var i = 0; i < swatches.length; i++){
        if(swatches[i].hex === expanded){
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
    var swatches = this.data.swatches
    var sku = null
    for(var i = 0; i < swatches.length; i++){
      var items = swatches[i].items || []
      for(var j = 0; j < items.length; j++){
        if(items[j].id === id){ sku = items[j]; break }
      }
      if(sku) break
    }
    if(!sku) return
    var cart = wx.getStorageSync('cart') || []
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入清单', icon: 'success' })
  },
  setViewMode(e){
    this.setData({ viewMode: e.currentTarget.dataset.mode, expandedKey: '' })
  },
  clearBrandFilter(){
    this.setData({ filterBrand: '' })
    if(this.data.selectedCat) this.selectCategory(this.data.selectedCat)
  },
  goCart(){
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
