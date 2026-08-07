var community = null
try{ community = require('../../utils/community') }catch(e){}

var ALL_TAGS = ['干皮','油皮','混油皮','干敏皮','中性皮','痘痘肌','白皮','黄皮','黑皮','韩妆','日杂妆','欧美妆','亚裔妆','泰妆','法式妆','通勤妆','约会妆','派对妆','平价','中等','高端']

function _fmtTag(key){
  var map = { dry:'干皮', oily:'油皮', combination:'混油皮', sensitive:'干敏皮', normal:'中性皮', acne_prone:'痘痘肌' }
  return map[key] || ''
}
function _depthTag(key){
  var map = { very_fair:'白皮', fair:'白皮', light:'白皮', medium:'黄皮', tan:'黄皮', deep:'黑皮' }
  return map[key] || ''
}
function _budgetTag(ids){
  var app = getApp()
  var prods = (app && app.globalData && app.globalData.products) || []
  var prices = []
  for(var i = 0; i < ids.length; i++){
    for(var j = 0; j < prods.length; j++){
      if(prods[j].id === ids[i]){ prices.push(prods[j].price); break }
    }
  }
  if(prices.length === 0) return ''
  prices.sort(function(a,b){ return a - b })
  var mid = prices[Math.floor(prices.length / 2)]
  if(mid < 100) return '平价'
  if(mid < 300) return '中等'
  return '高端'
}

Page({
  data: {
    cartItems: [],
    selectedIds: [],
    selectedSet: {},
    selectedProds: [],
    tagSet: {},
    title: '',
    description: '',
    tags: [],
    allTagOptions: ALL_TAGS,
    canPublish: false,
    createMode: 'cart',
    searchQuery: '',
    searchResults: [],
    allProducts: [],
    myProductSet: {}
  },
  onLoad(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._loadCart()
    this._loadAllProducts()
  },
  onShow(){ this._loadCart(); this._loadMySet() },
  _loadCart(){
    var items = wx.getStorageSync('cart') || []
    this.setData({ cartItems: items })
  },
  _loadAllProducts(){
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || []
    if(prods.length === 0){
      try{ prods = require('../../data/products') }catch(e){}
    }
    this.setData({ allProducts: prods })
  },
  _loadMySet(){
    var mp = wx.getStorageSync('myProducts') || []
    var set = {}
    for(var i = 0; i < mp.length; i++){ set[mp[i].id] = true }
    this.setData({ myProductSet: set })
  },
  _computeSets(){
    var selSet = {}
    var ids = this.data.selectedIds
    for(var i = 0; i < ids.length; i++){ selSet[ids[i]] = true }
    var tSet = {}
    var tags = this.data.tags
    for(var j = 0; j < tags.length; j++){ tSet[tags[j]] = true }
    var prods = []
    var all = this.data.allProducts
    var cart = this.data.cartItems
    for(var k = 0; k < ids.length; k++){
      var found = null
      for(var a = 0; a < all.length; a++){ if(all[a].id === ids[k]){ found = all[a]; break } }
      if(!found){ for(var c = 0; c < cart.length; c++){ if(cart[c].id === ids[k]){ found = cart[c]; break } } }
      if(found) prods.push(found)
    }
    this.setData({ selectedSet: selSet, tagSet: tSet, selectedProds: prods })
  },
  onSwitchMode(e){
    var mode = e.currentTarget.dataset.mode
    this.setData({ createMode: mode })
  },
  onToggleProduct(e){
    var id = e.currentTarget.dataset.id
    this._toggleId(id)
  },
  onToggleSearchResult(e){
    var id = e.currentTarget.dataset.id
    this._toggleId(id)
  },
  _toggleId(id){
    var ids = this.data.selectedIds.slice()
    var idx = ids.indexOf(id)
    if(idx > -1){
      ids.splice(idx, 1)
    } else {
      ids.push(id)
    }
    this.setData({ selectedIds: ids })
    this._computeSets()
    this._autoDetectTags(ids)
    this._checkCanPublish()
  },
  onSearchInput(e){
    var q = (e.detail.value || '').trim().toLowerCase()
    this.setData({ searchQuery: q })
    if(!q){
      this.setData({ searchResults: [] })
      return
    }
    var prods = this.data.allProducts
    var matched = []
    for(var i = 0; i < prods.length; i++){
      var p = prods[i]
      var name = (p.name || '').toLowerCase()
      var brand = (p.brand || '').toLowerCase()
      var color = (p.colorName || '').toLowerCase()
      if(name.indexOf(q) > -1 || brand.indexOf(q) > -1 || color.indexOf(q) > -1){
        matched.push(p)
      }
    }
    matched.sort(function(a, b){
      var an = (a.name || '').toLowerCase()
      var bn = (b.name || '').toLowerCase()
      var aMatch = an.indexOf(q) > -1 ? 0 : 1
      var bMatch = bn.indexOf(q) > -1 ? 0 : 1
      if(aMatch !== bMatch) return aMatch - bMatch
      return 0
    })
    this.setData({ searchResults: matched.slice(0, 30) })
  },
  _autoDetectTags(ids){
    var tags = []
    var profile = wx.getStorageSync('skinProfile') || {}
    var st = _fmtTag(profile.skinType)
    if(st && ids.length > 0) tags.push(st)
    var dt = _depthTag(profile.depth)
    if(dt && ids.length > 0) tags.push(dt)
    var bt = _budgetTag(ids)
    if(bt) tags.push(bt)
    this.setData({ tags: tags })
    this._computeSets()
  },
  onToggleTag(e){
    var t = e.currentTarget.dataset.tag
    var tags = this.data.tags.slice()
    var idx = tags.indexOf(t)
    if(idx > -1){
      tags.splice(idx, 1)
    } else {
      tags.push(t)
    }
    this.setData({ tags: tags })
    this._computeSets()
  },
  onTitleInput(e){ this.setData({ title: e.detail.value }, function(){ this._checkCanPublish() }) },
  onDescInput(e){ this.setData({ description: e.detail.value }) },
  _checkCanPublish(){
    this.setData({ canPublish: this.data.selectedIds.length > 0 && this.data.title.trim().length > 0 })
  },
  onPublish(){
    if(!this.data.canPublish) return
    if(!community){ wx.showToast({ title: '社群模块未初始化', icon: 'none' }); return }
    var userId = community.getUserId()
    var profile = wx.getStorageSync('userProfile') || {}
    var post = {
      author_id: userId,
      author_name: profile.name || '',
      title: this.data.title.trim(),
      description: this.data.description.trim(),
      product_ids: this.data.selectedIds,
      tags: this.data.tags
    }
    console.log('[create] 即将发布 post:', JSON.stringify(post))
    wx.showLoading({ title: '发布中...' })
    community.createPost(post, function(res){
      console.log('[create] createPost 回调结果:', JSON.stringify(res))
      wx.hideLoading()
      if(res){
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(function(){ wx.navigateBack() }, 1000)
      } else {
        wx.showToast({ title: '发布失败，请重试', icon: 'none' })
      }
    })
  },
  goBack(){ wx.navigateBack() },
  goChecklist(){ wx.switchTab({ url: '/pages/checklist/checklist' }) }
})
