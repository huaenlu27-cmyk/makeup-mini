var CAT_ORDER = []
try{ var cfg = require('../../data/config'); CAT_ORDER = cfg.CAT_ORDER || [] }catch(e){}

var _fallbackProds = null
try{ _fallbackProds = require('../../data/products') }catch(e){}

var FOUNDATION_COLORS = [
  { name:'白皙', hex:'#FDE8D0' }, { name:'自然白皙', hex:'#F5D5B8' }, { name:'自然色', hex:'#E8C4A2' },
  { name:'自然偏黄', hex:'#D4A574' }, { name:'小麦色', hex:'#C49464' }, { name:'健康小麦', hex:'#B8845A' },
  { name:'蜜色', hex:'#A0724A' }, { name:'古铜', hex:'#8B6040' }, { name:'深色', hex:'#6B4430' }
]
var LIP_COLORS = [
  { name:'正红', hex:'#CC0000' }, { name:'草莓红', hex:'#D4403A' }, { name:'豆沙粉', hex:'#C4665A' },
  { name:'蜜桃粉', hex:'#E8787A' }, { name:'干枯玫瑰', hex:'#D4737A' }, { name:'珊瑚橘', hex:'#E8737A' },
  { name:'铁锈红', hex:'#A05252' }, { name:'枫叶红', hex:'#B55B52' }, { name:'姨妈红', hex:'#8B3A3A' },
  { name:'玫红', hex:'#DE5D83' }, { name:'奶茶色', hex:'#D4837A' }, { name:'裸棕', hex:'#9B6E5E' }
]
var BLUSH_COLORS = [
  { name:'嫩粉', hex:'#FFB6C1' }, { name:'蜜桃', hex:'#FFA07A' }, { name:'珊瑚', hex:'#FF8C69' },
  { name:'裸杏', hex:'#E8A090' }, { name:'梅子', hex:'#DDA0DD' }, { name:'莓果', hex:'#DB7093' }
]
var EYESHADOW_COLORS = [
  { name:'香槟金', hex:'#D2B48C' }, { name:'大地棕', hex:'#C9A88C' }, { name:'焦糖棕', hex:'#A0522D' },
  { name:'古铜金', hex:'#B8860B' }, { name:'暖橘棕', hex:'#CD853F' }, { name:'灰棕', hex:'#8B8682' },
  { name:'玫瑰金', hex:'#C08081' }, { name:'紫灰', hex:'#D8BFD8' }
]
var NO_COLOR_CATS = ['眉笔','眼线','睫毛膏','化妆刷','卸妆','防晒','妆前精华']

function _getPalette(cat){
  if(!cat) return null
  if(cat.indexOf('口红')>-1 || cat.indexOf('唇')>-1) return LIP_COLORS
  if(cat.indexOf('粉底')>-1 || cat.indexOf('气垫')>-1 || cat.indexOf('遮瑕')>-1) return FOUNDATION_COLORS
  if(cat.indexOf('腮红')>-1) return BLUSH_COLORS
  if(cat.indexOf('眼影')>-1) return EYESHADOW_COLORS
  for(var i=0;i<NO_COLOR_CATS.length;i++){ if(cat.indexOf(NO_COLOR_CATS[i])>-1) return [] }
  return null
}

Page({
  data: {
    tabMode: 'catalog',
    allProducts: [],
    filteredProducts: [],
    selectedIds: [],
    selectedSet: {},
    mySet: {},
    searchQuery: '',
    activeCat: '',
    cats: [],
    manualBrand: '',
    manualName: '',
    manualCategory: '',
    manualColorName: '',
    manualHex: '',
    myProducts: [],
    totalCount: 0,
    matchResults: [],
    palette: null,
    catSearchQuery: '',
    filteredCats: []
  },
  onLoad(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._loadProducts()
    this._loadMyProducts()
    this._loadCats()
  },
  onShow(){
    this._loadMyProducts()
  },
  _loadCats(){
    var cats = []
    for(var i = 0; i < CAT_ORDER.length; i++){
      var c = CAT_ORDER[i].split('(')[0].trim()
      if(cats.indexOf(c) === -1) cats.push(c)
    }
    if(cats.indexOf('其他') === -1) cats.push('其他')
    this.setData({ cats: cats, activeCat: cats.length > 0 ? cats[0] : '' })
    if(this.data.tabMode === 'catalog') this._filter()
  },
  _loadProducts(){
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || _fallbackProds || []
    this.setData({ allProducts: prods, filteredProducts: prods })
  },
  _loadMyProducts(){
    var mp = wx.getStorageSync('myProducts') || []
    var mys = {}
    for(var i = 0; i < mp.length; i++){ mys[mp[i].id] = true }
    this.setData({ myProducts: mp, mySet: mys, totalCount: mp.length })
  },
  _filter(){
    var prods = this.data.allProducts
    var q = this.data.searchQuery
    var cat = this.data.activeCat
    var result = prods
    if(cat && cat !== '全部'){
      result = prods.filter(function(p){
        return p.category && p.category.indexOf(cat) > -1
      })
    }
    if(q){
      var ql = q.toLowerCase()
      result = result.filter(function(p){
        return (p.name && p.name.toLowerCase().indexOf(ql) > -1) ||
               (p.brand && p.brand.toLowerCase().indexOf(ql) > -1) ||
               (p.colorName && p.colorName.toLowerCase().indexOf(ql) > -1)
      })
    }
    this.setData({ filteredProducts: result })
  },
  onSwitchTab(e){
    this.setData({ tabMode: e.currentTarget.dataset.mode })
  },
  onSearchInput(e){
    this.setData({ searchQuery: (e.detail.value || '').trim() })
    this._filter()
  },
  onSelectCat(e){
    this.setData({ activeCat: e.currentTarget.dataset.cat })
    this._filter()
  },
  onToggleProduct(e){
    var id = e.currentTarget.dataset.id
    if(this.data.mySet[id]){
      this._removeProduct(id)
      return
    }
    var ids = this.data.selectedIds.slice()
    var idx = ids.indexOf(id)
    var selSet = Object.assign({}, this.data.selectedSet)
    if(idx > -1){
      ids.splice(idx, 1)
      delete selSet[id]
    } else {
      ids.push(id)
      selSet[id] = true
    }
    this.setData({ selectedIds: ids, selectedSet: selSet })
  },
  onImport(){
    var ids = this.data.selectedIds
    var prods = this.data.allProducts
    var existing = this.data.myProducts.slice()
    var mySet = Object.assign({}, this.data.mySet)
    var added = 0
    for(var i = 0; i < ids.length; i++){
      if(mySet[ids[i]]) continue
      for(var j = 0; j < prods.length; j++){
        if(prods[j].id === ids[i]){
          existing.push(Object.assign({}, prods[j], { from: 'catalog', addedAt: new Date().toISOString() }))
          mySet[ids[i]] = true
          added++
          break
        }
      }
    }
    wx.setStorageSync('myProducts', existing)
    this.setData({
      myProducts: existing,
      mySet: mySet,
      selectedIds: [],
      selectedSet: {},
      totalCount: existing.length
    })
    wx.showToast({ title: '已导入 ' + added + ' 件', icon: 'success' })
  },
  _removeProduct(id){
    var existing = this.data.myProducts.slice()
    for(var i = existing.length - 1; i >= 0; i--){
      if(existing[i].id === id){ existing.splice(i, 1); break }
    }
    var mySet = Object.assign({}, this.data.mySet)
    delete mySet[id]
    wx.setStorageSync('myProducts', existing)
    this.setData({
      myProducts: existing,
      mySet: mySet,
      totalCount: existing.length
    })
    wx.showToast({ title: '已移除', icon: 'none' })
  },
  onRemoveMyProduct(e){
    var id = e.currentTarget.dataset.id
    this._removeProduct(id)
  },
  onManualBrand(e){
    this.setData({ manualBrand: e.detail.value })
    this._doMatch()
  },
  onManualName(e){
    this.setData({ manualName: e.detail.value })
    this._doMatch()
  },
  onManualCatSearch(e){
    var q = (e.detail.value || '').trim()
    var cats = this.data.cats
    var filtered = cats
    if(q){
      var ql = q.toLowerCase()
      filtered = cats.filter(function(c){ return c.toLowerCase().indexOf(ql) > -1 })
    }
    this.setData({ catSearchQuery: e.detail.value, filteredCats: filtered })
  },
  onSelectManualCat(e){
    var cat = e.currentTarget.dataset.cat
    this.setData({
      manualCategory: cat,
      catSearchQuery: cat,
      filteredCats: [],
      palette: _getPalette(cat)
    })
  },
  onFocusCat(){
    this.setData({ filteredCats: this.data.cats })
  },
  _doMatch(){
    var brand = this.data.manualBrand.trim().toLowerCase()
    var name = this.data.manualName.trim().toLowerCase()
    if(!brand && !name){ this.setData({ matchResults: [] }); return }
    var tokens = (brand + ' ' + name).split(/\s+/).filter(function(t){ return t.length > 0 })
    if(tokens.length === 0){ this.setData({ matchResults: [] }); return }
    var prods = this.data.allProducts
    var results = []
    var selCat = this.data.manualCategory
    for(var i = 0; i < prods.length; i++){
      var p = prods[i]
      if(selCat && p.category.indexOf(selCat) === -1 && selCat.indexOf(p.category) === -1) continue
      var combined = ((p.brand||'') + ' ' + (p.name||'') + ' ' + (p.colorName||'')).toLowerCase()
      var score = 0
      var allMatch = true
      for(var t = 0; t < tokens.length; t++){
        if(combined.indexOf(tokens[t]) > -1){
          score += (combined.indexOf(tokens[t]) === 0 ? 3 : 1)
        } else {
          allMatch = false
          break
        }
      }
      if(allMatch) results.push({ product: p, score: score })
    }
    results.sort(function(a,b){ return b.score - a.score })
    results = results.slice(0, 6)
    this.setData({ matchResults: results })
  },
  onSelectMatch(e){
    var item = e.currentTarget.dataset.item
    this.setData({
      manualBrand: item.brand || '',
      manualName: item.name || '',
      manualCategory: item.category || '',
      manualColorName: item.colorName || '',
      manualHex: item.hex || '',
      palette: _getPalette(item.category),
      matchResults: []
    })
  },
  onSelectColor(e){
    this.setData({
      manualColorName: e.currentTarget.dataset.name,
      manualHex: e.currentTarget.dataset.hex
    })
  },
  onManualSubmit(){
    var brand = this.data.manualBrand.trim()
    var name = this.data.manualName.trim()
    var cat = this.data.manualCategory
    if(!brand || !name || !cat){
      wx.showToast({ title: '请填写品牌、产品名和分类', icon: 'none' })
      return
    }
    var id = 'my_' + Date.now()
    var item = {
      id: id,
      brand: brand,
      name: name,
      category: cat,
      colorName: this.data.manualColorName.trim() || '',
      hex: this.data.manualHex.trim() || '',
      price: 0,
      budget: 'low',
      from: 'manual',
      addedAt: new Date().toISOString()
    }
    var existing = this.data.myProducts.slice()
    existing.push(item)
    var mySet = Object.assign({}, this.data.mySet)
    mySet[id] = true
    wx.setStorageSync('myProducts', existing)
    this.setData({
      myProducts: existing,
      mySet: mySet,
      totalCount: existing.length,
      manualBrand: '',
      manualName: '',
      manualCategory: '',
      manualColorName: '',
      manualHex: ''
    })
    wx.showToast({ title: '已添加 ' + brand + ' ' + name, icon: 'success' })
  },
  goBack(){
    wx.navigateBack()
  }
})
