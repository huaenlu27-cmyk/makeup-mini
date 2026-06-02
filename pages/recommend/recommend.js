var taxonomy = null
try{ taxonomy = require('../../data/taxonomy') }catch(e){ taxonomy = {} }

var FOUNDATION_MAP = {
  '浅_暖': ['p04','p09'], '浅_中性': ['p05','p06','p08'], '浅_冷': ['p08','p06'],
  '中_暖': ['p05','p07','p09'], '中_中性': ['p05','p06','p07'], '中_冷': ['p06','p08'],
  '深_暖': ['p07'], '深_中性': ['p07'], '深_冷': ['p06','p08']
}
var POWDER_MAP = {
  '浅_暖': ['p14'], '浅_中性': ['p12','p13'], '浅_冷': ['p12'],
  '中_暖': ['p13','p14'], '中_中性': ['p12','p13'], '中_冷': ['p12'],
  '深_暖': ['p13'], '深_中性': ['p13'], '深_冷': ['p12']
}
var LIP_MAP = {
  '暖_day': ['p33','p35','p37','p41','p43'],
  '暖_night': ['p32','p34','p42'],
  '中性_day': ['p39','p40','p44'],
  '中性_night': ['p36','p38'],
  '冷_day': ['p38','p39'],
  '冷_night': ['p36','p40','p42']
}
var BLUSH_MAP = { '暖': ['p17','p18'], '中性': ['p15','p16'], '冷': ['p15','p16','p18'] }
var EYE_MAP = { 'day': ['p22','p23'], 'night': ['p24','p23'] }
var CONTOUR_IDS = ['p19','p20','p21']

var STYLE_MAP = {
  asian: { label:'亚裔妆', desc:'自然精致，MLBB风', ids:['p05','p09','p14','p39','p35','p44','p16','p22','p23','p12'] },
  korean: { label:'韩妆', desc:'水光肌，渐变水光唇', ids:['p09','p14','p35','p41','p43','p38','p18','p16','p22','p23'] },
  japanese: { label:'日杂妆', desc:'温暖大地色，枫叶红棕', ids:['p05','p04','p12','p33','p37','p40','p44','p17','p22','p23'] },
  western: { label:'欧美妆', desc:'高遮瑕，立体轮廓，烟熏眼', ids:['p06','p08','p13','p32','p36','p34','p19','p20','p24','p25','p28'] },
  thai: { label:'泰妆', desc:'哑光高遮瑕，金棕古铜调', ids:['p07','p13','p34','p37','p42','p17','p18','p22','p24'] },
  french: { label:'法式慵懒妆', desc:'半哑光质感，一抹红唇', ids:['p04','p05','p12','p36','p39','p25','p28','p13'] }
}

function getDepthKey(d){
  var m = { very_fair:'浅', fair:'浅', light:'浅', medium:'中', tan:'深', deep:'深' }
  return m[d] || '中'
}
function getUTKey(ut){
  if(ut === 'warm') return '暖'
  if(ut === 'cool') return '冷'
  return '中性'
}
function getOccKey(occ){
  return (occ === 'date' || occ === 'party') ? 'night' : 'day'
}
function findByIds(prods, ids){
  var r = []
  for(var i = 0; i < ids.length; i++){
    for(var j = 0; j < prods.length; j++){
      if(prods[j].id === ids[i]){ r.push(prods[j]); break }
    }
  }
  return r
}

Page({
  data: {
    faceShapes: taxonomy.face_shapes || [],
    depthList: taxonomy.skin_depths || [],
    occasionList: [
      { key:'daily', name:'日常', icon:'🌿' },
      { key:'commute', name:'通勤', icon:'💼' },
      { key:'date', name:'约会', icon:'💕' },
      { key:'party', name:'派对', icon:'🎉' }
    ],
    selFace: 'oval',
    selDepth: 'medium',
    selUndertone: 'neutral',
    selOccasion: 'daily',
    selStyle: 'korean',
    currentFaceDetail: null,
    results: null,
    hasResult: false,
    genKey: 0,
    showDepthTip: false,
    showUndertoneTip: false,
    tipTop: 0,
    tipLeft: 0,
    tabMode: 'skin',
    styleList: [
      { key:'asian', name:'亚裔妆', icon:'🌏' },
      { key:'korean', name:'韩妆', icon:'🇰🇷' },
      { key:'japanese', name:'日杂妆', icon:'🌸' },
      { key:'western', name:'欧美妆', icon:'🗽' },
      { key:'thai', name:'泰妆', icon:'🌴' },
      { key:'french', name:'法式慵懒', icon:'🥐' }
    ]
  },
  onLoad(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
  },
  onShowTip(e){
    var key = e.currentTarget.dataset.key
    var self = this
    if((key === 'depth' && this.data.showDepthTip) || (key === 'undertone' && this.data.showUndertoneTip)){
      self.setData({ showDepthTip: false, showUndertoneTip: false })
      return
    }
    wx.createSelectorQuery().select('#' + key + '-icon').boundingClientRect(function(rect){
      if(!rect) return
      var d = {}
      d[key === 'depth' ? 'showDepthTip' : 'showUndertoneTip'] = true
      d.showDepthTip = key === 'depth'
      d.showUndertoneTip = key === 'undertone'
      d.tipTop = rect.top + rect.height + 8
      d.tipLeft = rect.left
      self.setData(d)
    }).exec()
  },
  onHideTip(){
    this.setData({ showDepthTip: false, showUndertoneTip: false })
  },
  onTabMode(e){
    this.setData({ tabMode: e.currentTarget.dataset.mode })
  },
  onSelStyle(e){
    this.setData({ selStyle: e.currentTarget.dataset.key })
  },
  onSelFace(e){
    var key = e.currentTarget.dataset.key
    var detail = null
    var shapes = taxonomy.face_shapes || []
    for(var i = 0; i < shapes.length; i++){
      if(shapes[i].key === key){ detail = shapes[i]; break }
    }
    this.setData({ selFace: key, currentFaceDetail: detail })
  },
  onSelDepth(e){ this.setData({ selDepth: e.currentTarget.dataset.key }) },
  onSelUndertone(e){ this.setData({ selUndertone: e.currentTarget.dataset.key }) },
  onSelOccasion(e){ this.setData({ selOccasion: e.currentTarget.dataset.key }) },
  onGenerate(){
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || []
    if(prods.length === 0){
      wx.showToast({ title: '数据加载中请稍后', icon: 'none' })
      return
    }
    if(this.data.tabMode === 'style'){
      this._genByStyle(prods)
    } else {
      this._genBySkin(prods)
    }
  },
  _genBySkin(prods){
    var dk = getDepthKey(this.data.selDepth)
    var uk = getUTKey(this.data.selUndertone)
    var ok = getOccKey(this.data.selOccasion)
    var groups = []

    var baseItems = findByIds(prods, FOUNDATION_MAP[dk+'_'+uk]||[]).concat(
      findByIds(prods, POWDER_MAP[dk+'_'+uk]||[]))
    if(baseItems.length > 0){
      groups.push({ title:'底妆推荐', icon:'🔵', items:baseItems })
    }
    var lipItems = findByIds(prods, LIP_MAP[uk+'_'+ok]||[])
    if(lipItems.length > 0){
      groups.push({ title:'唇部推荐', icon:'🔴', items:lipItems })
    }
    var blushItems = findByIds(prods, BLUSH_MAP[uk]||[])
    if(blushItems.length > 0){
      groups.push({ title:'腮红推荐', icon:'🌸', items:blushItems })
    }
    var eyeItems = findByIds(prods, EYE_MAP[ok]||[])
    if(eyeItems.length > 0){
      groups.push({ title:'眼妆推荐', icon:'👁️', items:eyeItems })
    }
    var ctItems = findByIds(prods, CONTOUR_IDS)
    if(ctItems.length > 0){
      groups.push({ title:'修容 & 高光', icon:'✨', items:ctItems })
    }

    var tip = ''
    var shapes = taxonomy.face_shapes || []
    for(var i = 0; i < shapes.length; i++){
      if(shapes[i].key === this.data.selFace){ tip = shapes[i].description; break }
    }

    this.setData({
      results: { groups: groups, faceShapeTip: tip },
      hasResult: true,
      genKey: this.data.genKey + 1
    })
  },
  _genByStyle(prods){
    var styleKey = this.data.selStyle
    var styleInfo = STYLE_MAP[styleKey]
    if(!styleInfo){ return }
    var allIds = styleInfo.ids || []
    var items = findByIds(prods, allIds)

    var catOrder = ['隔离/妆前乳','粉底液/气垫','粉饼/散粉','眼影','眼线','睫毛膏','腮红','修容/修颜','高光','口红/唇釉','遮瑕','眉笔/眉粉/染眉']
    var catIcon = { '隔离/妆前乳':'🧴','粉底液/气垫':'🔵','粉饼/散粉':'⚪','眼影':'👁️','眼线':'✏️','睫毛膏':'🫦','腮红':'🌸','修容/修颜':'✨','高光':'💎','口红/唇釉':'💄','遮瑕':'🎨','眉笔/眉粉/染眉':'✍️' }

    var groups = []
    for(var c = 0; c < catOrder.length; c++){
      var catItems = []
      for(var i = 0; i < items.length; i++){
        if(items[i].category === catOrder[c]){ catItems.push(items[i]) }
      }
      if(catItems.length > 0){
        groups.push({ title:catOrder[c], icon:catIcon[catOrder[c]] || '📦', items:catItems })
      }
    }

    this.setData({
      results: { groups: groups, styleInfo: styleInfo },
      hasResult: true,
      genKey: this.data.genKey + 1
    })
  },
  onAddToCart(e){
    var id = e.currentTarget.dataset.id
    var groups = this.data.results.groups
    var sku = null
    for(var g = 0; g < groups.length; g++){
      var items = groups[g].items || []
      for(var i = 0; i < items.length; i++){
        if(items[i].id === id){ sku = items[i]; break }
      }
      if(sku) break
    }
    if(!sku) return
    var cart = wx.getStorageSync('cart') || []
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    wx.showToast({ title:'已加入清单', icon:'success' })
  },
  onReset(){
    this.setData({ hasResult: false, results: null })
  }
})
