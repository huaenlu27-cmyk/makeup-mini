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

    var shapeNames = shapes.map(function(s){ return s.name })
    var shapeIdx = 0
    for(var i = 0; i < shapes.length; i++){ if(shapes[i].key === profile.faceShape){ shapeIdx = i; break } }

    var depthNames = depths.map(function(s){ return s.name })
    var depthIdx = 0
    for(var i = 0; i < depths.length; i++){ if(depths[i].key === profile.depth){ depthIdx = i; break } }

    var undertoneKeys = ['warm', 'neutral', 'cool']
    var undertoneNames = ['暖调', '中性', '冷调']
    var undertoneIdx = undertoneKeys.indexOf(profile.undertone)
    if(undertoneIdx === -1) undertoneIdx = 0

    var occasionNames = occasionList.map(function(s){ return s.name })
    var occasionIdx = 0
    for(var i = 0; i < occasionList.length; i++){ if(occasionList[i].key === profile.occasion){ occasionIdx = i; break } }

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
      recentProducts: items,
      faceShapeNames: shapeNames,
      faceShapeIndex: shapeIdx,
      depthNames: depthNames,
      depthIndex: depthIdx,
      undertoneNames: undertoneNames,
      undertoneIndex: undertoneIdx,
      occasionNames: occasionNames,
      occasionIndex: occasionIdx
    })
  },
  onPickerFace(e){
    var idx = e.detail.value
    var profile = this.data.profile
    var shapes = this.data.faceShapes
    profile.faceShape = shapes[idx].key
    profile.faceShapeName = shapes[idx].name
    this.setData({ profile: profile, faceShapeIndex: idx })
    wx.setStorageSync('skinProfile', profile)
  },
  onPickerDepth(e){
    var idx = e.detail.value
    var profile = this.data.profile
    var list = this.data.depthList
    profile.depth = list[idx].key
    profile.depthName = list[idx].name
    this.setData({ profile: profile, depthIndex: idx })
    wx.setStorageSync('skinProfile', profile)
  },
  onPickerUndertone(e){
    var idx = e.detail.value
    var profile = this.data.profile
    var map = ['warm', 'neutral', 'cool']
    var names = ['暖调', '中性', '冷调']
    profile.undertone = map[idx]
    profile.undertoneName = names[idx]
    this.setData({ profile: profile, undertoneIndex: idx })
    wx.setStorageSync('skinProfile', profile)
  },
  onPickerOccasion(e){
    var idx = e.detail.value
    var profile = this.data.profile
    var list = this.data.occasionList
    profile.occasion = list[idx].key
    profile.occasionName = list[idx].name
    this.setData({ profile: profile, occasionIndex: idx })
    wx.setStorageSync('skinProfile', profile)
  },
  onBudgetChange(e){
    var idx = e.detail.value
    this.setData({ budgetIndex: idx })
    wx.setStorageSync('preferences', { budgetIndex: idx })
  },
  goRecommend(){
    wx.setStorageSync('_fromProfile', true)
    wx.switchTab({ url: '/pages/recommend/recommend' })
  },
  goChecklist(){
    wx.switchTab({ url: '/pages/checklist/checklist' })
  }
})
