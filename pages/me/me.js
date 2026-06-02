var taxonomy = null
try{ taxonomy = require('../../data/taxonomy') }catch(e){ taxonomy = {} }

var _fallbackProds = null
try{ _fallbackProds = require('../../data/products') }catch(e){} 

var BUDGET_OPTIONS = ['全部价位', '平价 (< ¥100)', '中等 (¥100 - ¥299)', '高端 (¥300 +)']

var UNDERTONE_MAP = { warm: '暖调', neutral: '中性', cool: '冷调' }
var OCCASION_MAP = { daily: '日常', commute: '通勤', date: '约会', party: '派对' }

function findName(list, key){
  for(var i = 0; i < list.length; i++){
    if(list[i].key === key) return list[i].name
  }
  return key
}

function enrichProfile(p, shapes, depths, occasions){
  for(var i = 0; i < shapes.length; i++){
    if(shapes[i].key === p.faceShape){ p.faceShapeName = shapes[i].name; break }
  }
  for(var i = 0; i < depths.length; i++){
    if(depths[i].key === p.depth){ p.depthName = depths[i].name; break }
  }
  p.undertoneName = UNDERTONE_MAP[p.undertone] || p.undertone
  for(var i = 0; i < occasions.length; i++){
    if(occasions[i].key === p.occasion){ p.occasionName = occasions[i].name; break }
  }
  return p
}

Page({
  data: {
    faceShapes: taxonomy.face_shapes || [],
    depthList: taxonomy.skin_depths || [],
    occasionList: [
      { key:'daily', name:'日常' },
      { key:'commute', name:'通勤' },
      { key:'date', name:'约会' },
      { key:'party', name:'派对' }
    ],
    budgetOptions: BUDGET_OPTIONS,
    profile: null,
    recentProducts: [],
    budgetIndex: 0
  },
  onShow(){
    this.loadAll()
  },
  loadAll(){
    var profile = wx.getStorageSync('skinProfile') || {
      faceShape: 'oval', depth: 'medium', undertone: 'neutral', occasion: 'daily'
    }
    var shapes = this.data.faceShapes
    var depths = this.data.depthList
    var occasionList = this.data.occasionList
    profile = enrichProfile(profile, shapes, depths, occasionList)
    var pref = wx.getStorageSync('preferences') || {}
    var ids = wx.getStorageSync('recentViews') || []
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || _fallbackProds || []
    var items = []
    for(var i = 0; i < ids.length && items.length < 10; i++){
      for(var j = 0; j < prods.length; j++){
        if(prods[j].id === ids[i]){ items.push(prods[j]); break }
      }
    }
    this.setData({
      profile: profile,
      budgetIndex: pref.budgetIndex || 0,
      recentProducts: items
    })
  },
  onEditFace(e){
    var profile = this.data.profile
    var shapes = this.data.faceShapes
    var idx = -1
    for(var i = 0; i < shapes.length; i++){
      if(shapes[i].key === profile.faceShape){ idx = i; break }
    }
    profile.faceShape = shapes[(idx + 1) % shapes.length].key
    enrichProfile(profile, shapes, this.data.depthList, this.data.occasionList)
    this.setData({ profile: profile })
    wx.setStorageSync('skinProfile', profile)
  },
  onEditDepth(e){
    var profile = this.data.profile
    var list = this.data.depthList
    var idx = -1
    for(var i = 0; i < list.length; i++){
      if(list[i].key === profile.depth){ idx = i; break }
    }
    profile.depth = list[(idx + 1) % list.length].key
    enrichProfile(profile, this.data.faceShapes, list, this.data.occasionList)
    this.setData({ profile: profile })
    wx.setStorageSync('skinProfile', profile)
  },
  onEditUndertone(e){
    var profile = this.data.profile
    var map = ['warm', 'neutral', 'cool']
    var idx = map.indexOf(profile.undertone)
    if(idx === -1) idx = 1
    profile.undertone = map[(idx + 1) % map.length]
    enrichProfile(profile, this.data.faceShapes, this.data.depthList, this.data.occasionList)
    this.setData({ profile: profile })
    wx.setStorageSync('skinProfile', profile)
  },
  onEditOccasion(e){
    var profile = this.data.profile
    var list = this.data.occasionList
    var idx = -1
    for(var i = 0; i < list.length; i++){
      if(list[i].key === profile.occasion){ idx = i; break }
    }
    profile.occasion = list[(idx + 1) % list.length].key
    enrichProfile(profile, this.data.faceShapes, this.data.depthList, list)
    this.setData({ profile: profile })
    wx.setStorageSync('skinProfile', profile)
  },
  onBudgetChange(e){
    var idx = e.detail.value
    this.setData({ budgetIndex: idx })
    wx.setStorageSync('preferences', { budgetIndex: idx })
  },
  goRecommend(){
    wx.switchTab({ url: '/pages/recommend/recommend' })
  },
  goChecklist(){
    wx.switchTab({ url: '/pages/checklist/checklist' })
  }
})
