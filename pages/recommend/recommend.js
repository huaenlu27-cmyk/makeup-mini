var taxonomy = null
try{ taxonomy = require('../../data/taxonomy') }catch(e){ taxonomy = {} }

var _fallbackProds = null
try{ _fallbackProds = require('../../data/products') }catch(e){}

var cfg = null
try{ cfg = require('../../data/config') }catch(e){}
var rules = null
try{ rules = require('../../data/recommend_rules') }catch(e){}

var AI_API_URL = 'https://api.deepseek.com/chat/completions'
var AI_API_KEY = 'sk-38e08031679547b1a03efb30e2af64c2'

var STYLE_MAP = {
  asian: { label:'亚裔妆', desc:'自然精致，MLBB风', ids:['p05','p09','p14','p39','p35','p44','p16','p22','p23','p12','p21','p01'] },
  korean: { label:'韩妆', desc:'水光肌，渐变水光唇', ids:['p09','p14','p35','p41','p43','p38','p18','p16','p22','p23','p48','p80'] },
  japanese: { label:'日杂妆', desc:'温暖大地色，枫叶红棕', ids:['p05','p04','p12','p33','p37','p40','p44','p17','p22','p23','p20','p93'] },
  western: { label:'欧美妆', desc:'高遮瑕，立体轮廓，烟熏眼', ids:['p06','p08','p13','p32','p36','p34','p19','p20','p24','p25','p28','p92','p86'] },
  thai: { label:'泰妆', desc:'哑光高遮瑕，金棕古铜调', ids:['p07','p13','p34','p37','p42','p17','p18','p22','p24','p90','p86'] },
  french: { label:'法式慵懒妆', desc:'半哑光质感，一抹红唇', ids:['p04','p05','p12','p36','p39','p25','p28','p13','p21','p44','p94'] }
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
    genLoading: false,
    aiInput: '',
    aiLoading: false,
    aiHistory: [],
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
    var savedMode = wx.getStorageSync('_savedTabMode') || 'skin'
    this.setData({ tabMode: savedMode })
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._loadProfile()
    this._loadAIHistory()
  },
  onShow(){
    this._updateBadge()
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    var fromProfile = wx.getStorageSync('_fromProfile')
    if(fromProfile){
      this.setData({ tabMode: 'skin', hasResult: false, results: null })
      wx.setStorageSync('_fromProfile', false)
      wx.removeStorageSync('_lastResults')
    } else {
      var last = wx.getStorageSync('_lastResults')
      if(last && !this.data.hasResult){
        this.setData({ results: last.results, hasResult: true })
      }
    }
    this._loadProfile()
    this._loadAIHistory()
  },
  _loadProfile(){
    var saved = wx.getStorageSync('skinProfile')
    if(saved){
      var d = {}
      if(saved.faceShape) d.selFace = saved.faceShape
      if(saved.depth) d.selDepth = saved.depth
      if(saved.undertone) d.selUndertone = saved.undertone
      if(saved.occasion) d.selOccasion = saved.occasion
      this.setData(d)
    }
    var shapes = taxonomy.face_shapes || []
    for(var i = 0; i < shapes.length; i++){
      if(shapes[i].key === this.data.selFace){ this.setData({ currentFaceDetail: shapes[i] }); break }
    }
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
    var mode = e.currentTarget.dataset.mode
    this.setData({ tabMode: mode })
    wx.setStorageSync('_savedTabMode', mode)
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
    this.setData({ genLoading: true })
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || _fallbackProds || []
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

    var fMap = (rules && rules.foundation_by_depth_undertone) || {}
    var lMap = (rules && rules.lip_by_undertone_occasion) || {}
    var bMap = (rules && rules.blush_by_undertone) || {}
    var eMap = (rules && rules.eyeshadow_by_occasion) || {}
    var cMap = (rules && rules.contour_by_face_shape) || {}
    var hMap = (rules && rules.highlight_by_undertone) || {}
    var pMap = (rules && rules.powder_by_skin) || {}

    var depthToSkin = { very_fair:'normal', fair:'normal', light:'normal', medium:'combination', tan:'oily', deep:'oily' }
    var baseItems = findByIds(prods, (fMap[dk+'_'+uk]||[])).concat(
      findByIds(prods, (pMap[depthToSkin[this.data.selDepth]||'normal']||[])))
    if(baseItems.length > 0){
      groups.push({ title:'底妆推荐', icon:'🔵', items:baseItems })
    }
    var lipItems = findByIds(prods, lMap[uk+'_'+ok]||[])
    if(lipItems.length > 0){
      groups.push({ title:'唇部推荐', icon:'🔴', items:lipItems })
    }
    var blushItems = findByIds(prods, bMap[uk]||[])
    if(blushItems.length > 0){
      groups.push({ title:'腮红推荐', icon:'🌸', items:blushItems })
    }
    var eyeItems = findByIds(prods, eMap[ok]||[])
    if(eyeItems.length > 0){
      groups.push({ title:'眼妆推荐', icon:'👁️', items:eyeItems })
    }
    var ctItems = findByIds(prods, (cMap[this.data.selFace]||[])).concat(
      findByIds(prods, (hMap[uk]||[])))
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
      genKey: this.data.genKey + 1,
      genLoading: false
    })
  },
  _genByStyle(prods){
    var styleKey = this.data.selStyle
    var styleInfo = STYLE_MAP[styleKey]
    if(!styleInfo){ return }
    var allIds = styleInfo.ids || []
    var items = findByIds(prods, allIds)

    var groups = []
    var catOrder = (cfg && cfg.CAT_ORDER) || []
    var catIcon = (cfg && cfg.CAT_ICON) || {}
    for(var c = 0; c < catOrder.length; c++){
      var catItems = []
      for(var i = 0; i < items.length; i++){
        if(items[i].category === catOrder[c]){ catItems.push(items[i]) }
      }
      if(catItems.length > 0){
        groups.push({ title:catOrder[c], icon:catIcon[catOrder[c]] || '📦', items:catItems })
      }
    }

    var newResults = { groups: groups, styleInfo: styleInfo }
    this.setData({
      results: newResults,
      hasResult: true,
      genKey: this.data.genKey + 1,
      genLoading: false
    })
    wx.setStorageSync('_lastResults', { results: newResults, tabMode: this.data.tabMode })
  },
  onAddToCart(e){
    var id = e.currentTarget.dataset.id
    var views = wx.getStorageSync('recentViews') || []
    var filtered = []
    for(var i = 0; i < views.length; i++){
      if(views[i] !== id) filtered.push(views[i])
    }
    filtered.unshift(id)
    if(filtered.length > 20) filtered = filtered.slice(0, 20)
    wx.setStorageSync('recentViews', filtered)

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
    for(var c = 0; c < cart.length; c++){
      if(cart[c].id === id){
        wx.showToast({ title: '已在清单中', icon: 'none' })
        return
      }
    }
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    this._updateBadge()
    wx.showToast({ title:'已加入清单', icon:'success' })
  },
  _updateBadge(){
    var cart = wx.getStorageSync('cart') || []
    wx.setTabBarBadge({ index: 2, text: cart.length > 99 ? '99+' : String(cart.length) })
  },
  onShareAppMessage(){
    var results = this.data.results
    var title = '我的专属美妆方案'
    if(results && results.groups && results.groups.length > 0){
      var names = results.groups.map(function(g){ return g.title }).join('、')
      title = title + ' - ' + names
    }
    return { title: title, path: '/pages/recommend/recommend' }
  },
  onSaveImage(){
    var results = this.data.results
    if(!results || !results.groups || results.groups.length === 0){
      wx.showToast({ title: '暂无方案可生成', icon: 'none' })
      return
    }
    wx.showLoading({ title: '生成中...' })
    var self = this
    wx.createSelectorQuery().select('#shareCanvas').node(function(res){
      var canvas = res.node
      var ctx = canvas.getContext('2d')
      var W = 300
      var P = 20
      var y = P
      var dpr = wx.getSystemInfoSync().pixelRatio || 2

      // compute height
      var h = P + 40 + 24 + 8
      for(var g = 0; g < results.groups.length; g++){
        h += 30
        h += (results.groups[g].items || []).length * 28
      }
      h += 36 + P

      // set canvas size (retina)
      canvas.width = W * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      // background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, h)

      // title
      ctx.fillStyle = '#3A2A30'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText('我的专属美妆方案', P, y + 24)
      y += 40

      // date
      var d = new Date()
      var ds = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
      ctx.fillStyle = '#A89098'
      ctx.font = '12px sans-serif'
      ctx.fillText(ds, P, y + 16)
      y += 24 + 8

      // groups
      for(var g = 0; g < results.groups.length; g++){
        var group = results.groups[g]
        // group title bg
        ctx.fillStyle = '#F8F4F6'
        ctx.fillRect(P, y, W - P * 2, 22)
        ctx.fillStyle = '#E595A8'
        ctx.font = 'bold 13px sans-serif'
        ctx.fillText(group.title, P + 10, y + 16)
        y += 30

        var items = group.items || []
        for(var i = 0; i < items.length; i++){
          var item = items[i]
          // swatch dot
          ctx.beginPath()
          ctx.arc(P + 8, y + 12, 7, 0, 2 * Math.PI)
          ctx.fillStyle = item.hex || '#f4f4f4'
          ctx.fill()
          ctx.strokeStyle = '#EDE4E7'
          ctx.lineWidth = 0.5
          ctx.stroke()

          // name
          ctx.fillStyle = '#3A2A30'
          ctx.font = '13px sans-serif'
          ctx.fillText(item.brand + ' ' + item.name, P + 22, y + 16)

          // price
          ctx.fillStyle = '#E595A8'
          ctx.font = '12px sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText('¥' + item.price, W - P, y + 16)
          ctx.textAlign = 'left'

          y += 28
        }
      }

      // footer
      y += 8
      ctx.fillStyle = '#CAB8BF'
      ctx.font = '11px sans-serif'
      ctx.fillText('由 美妆选购小助手 生成', P, y + 16)

      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0, y: 0,
        width: canvas.width, height: canvas.height,
        destWidth: canvas.width, destHeight: canvas.height,
        success: function(r){
          wx.hideLoading()
          wx.getSetting({
            success: function(set){
              if(set.authSetting['scope.writePhotosAlbum']){
                wx.saveImageToPhotosAlbum({
                  filePath: r.tempFilePath,
                  success: function(){ wx.showToast({ title: '已保存到相册', icon: 'success' }) },
                  fail: function(){ wx.showToast({ title: '保存失败', icon: 'none' }) }
                })
              } else {
                wx.authorize({
                  scope: 'scope.writePhotosAlbum',
                  success: function(){
                    wx.saveImageToPhotosAlbum({
                      filePath: r.tempFilePath,
                      success: function(){ wx.showToast({ title: '已保存到相册', icon: 'success' }) },
                      fail: function(){ wx.showToast({ title: '保存失败', icon: 'none' }) }
                    })
                  },
                  fail: function(){
                    wx.showModal({
                      title: '需要权限',
                      content: '请允许访问相册以保存图片',
                      success: function(m){
                        if(m.confirm) wx.openSetting()
                      }
                    })
                  }
                })
              }
            }
          })
        },
        fail: function(e){
          wx.hideLoading()
          wx.showToast({ title: '生成失败', icon: 'none' })
          console.error(e)
        }
      })
    }).exec()
  },
  onAddAllToCart(){
    var groups = this.data.results.groups
    if(!groups || groups.length === 0) return
    var allItems = []
    for(var g = 0; g < groups.length; g++){
      var items = groups[g].items || []
      for(var i = 0; i < items.length; i++){
        allItems.push(items[i])
      }
    }
    if(allItems.length === 0) return
    var cart = wx.getStorageSync('cart') || []
    var addedCount = 0
    for(var i = 0; i < allItems.length; i++){
      var exists = false
      for(var c = 0; c < cart.length; c++){
        if(cart[c].id === allItems[i].id){ exists = true; break }
      }
      if(!exists){
        cart.push(allItems[i])
        addedCount++
      }
    }
    wx.setStorageSync('cart', cart)
    this._updateBadge()
    if(addedCount === 0){
      wx.showToast({ title: '全部商品已在清单中', icon: 'none' })
    } else {
      wx.showToast({ title: '已加入 ' + addedCount + ' 件商品', icon: 'success' })
    }
  },
  onReset(){
    this.setData({ hasResult: false, results: null })
  },
  onAiInput(e){
    this.setData({ aiInput: e.detail.value })
  },
  onAiSubmit(){
    var input = this.data.aiInput.trim()
    if(!input) return
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || _fallbackProds || []
    if(prods.length === 0){
      wx.showToast({ title: '数据加载中请稍后', icon: 'none' })
      return
    }
    this.setData({ aiLoading: true })
    var systemPrompt = this._buildSystemPrompt(prods)
    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input }
    ]
    var self = this
    wx.request({
      url: AI_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_API_KEY
      },
      data: {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      },
      timeout: 60000,
      success(res){
        if(res.statusCode !== 200){
          var msg = 'AI 请求失败'
          if(res.data && res.data.error && res.data.error.message) msg = res.data.error.message
          wx.showToast({ title: msg, icon: 'none' })
          self.setData({ aiLoading: false })
          return
        }
        if(!res.data || !res.data.choices || !res.data.choices[0]){
          wx.showToast({ title: 'AI 返回格式异常', icon: 'none' })
          self.setData({ aiLoading: false })
          return
        }
        var content = res.data.choices[0].message.content
        self._genByAI(content, prods)
      },
      fail(err){
        var msg = (err.errMsg && err.errMsg.indexOf('timeout') > -1) ? '请求超时，请重试' : '网络错误，请重试'
        wx.showToast({ title: msg, icon: 'none' })
        self.setData({ aiLoading: false })
      }
    })
  },
  _buildSystemPrompt(prods){
    var list = prods.map(function(p){
      return { id: p.id, category: p.category, brand: p.brand, name: p.name, price: p.price, colorName: p.colorName }
    })
    var productJSON = JSON.stringify(list, null, 2)
    return '你是一个专业的美妆顾问。以下是可推荐的商品库：\n' + productJSON + '\n\n' +
      '请根据用户的描述，从上述商品库中选择最合适的商品，并以以下 JSON 格式回复（不要包含其他文字）：\n' +
      '{\n  "title": "通勤自然妆推荐",\n  "advice": "详细的化妆建议（用中文）",\n  "product_ids": ["p04", "p09"]\n}\n\n' +
      '要求：\n' +
      '- title 用 15 字以内概括用户的问题，作为标题\n' +
      '- advice 用中文，给出具体的化妆步骤和搭配建议\n' +
      '- product_ids 只包含上述商品库中存在的 ID，每个品类推荐 1-2 款\n' +
      '- 重要：advice 中提到的每一个商品都必须出现在 product_ids 中，不可遗漏\n' +
      '- 如果用户提到了预算、肤色、场合等信息，优先匹配\n' +
      '- 如果没有合适的商品，product_ids 返回空数组'
  },
  _genByAI(content, prods){
    content = content.replace(/```json?\s*|\s*```/g, '').trim()
    try {
      var result = JSON.parse(content)
      if(!result.advice && !result.product_ids){
        throw new Error('invalid format')
      }
    } catch(e){
      wx.showToast({ title: 'AI 返回格式异常', icon: 'none' })
      this.setData({ aiLoading: false })
      return
    }
    var ids = result.product_ids || []
    var items = []
    for(var i = 0; i < ids.length; i++){
      for(var j = 0; j < prods.length; j++){
        if(prods[j].id === ids[i]){ items.push(prods[j]); break }
      }
    }
    var catOrder = (cfg && cfg.CAT_ORDER) || []
    var catIcon = (cfg && cfg.CAT_ICON) || {}
    var groups = []
    for(var c = 0; c < catOrder.length; c++){
      var catItems = []
      for(var i = 0; i < items.length; i++){
        if(items[i].category === catOrder[c]){ catItems.push(items[i]) }
      }
      if(catItems.length > 0){
        groups.push({ title: catOrder[c], icon: catIcon[catOrder[c]] || '📦', items: catItems })
      }
    }
    var input = this.data.aiInput
    var results = { groups: groups, aiAdvice: result.advice || '' }
    this.setData({
      results: results,
      hasResult: true,
      aiLoading: false,
      aiInput: ''
    })
    wx.setStorageSync('_lastResults', { results: results, tabMode: this.data.tabMode })
    var title = result.title || input.slice(0, 20)
    this._saveAIHistory(input, title, results)
  },
  _saveAIHistory(input, title, results){
    var history = wx.getStorageSync('aiHistory') || []
    history.unshift({
      input: input,
      title: title,
      results: results,
      timestamp: Date.now()
    })
    if(history.length > 20) history = history.slice(0, 20)
    history = this._formatHistory(history)
    wx.setStorageSync('aiHistory', history)
    this.setData({ aiHistory: history })
  },
  _loadAIHistory(){
    var history = wx.getStorageSync('aiHistory') || []
    history = this._formatHistory(history)
    this.setData({ aiHistory: history })
  },
  _formatHistory(history){
    var now = Date.now()
    for(var i = 0; i < history.length; i++){
      var diff = Math.floor((now - history[i].timestamp) / 1000)
      if(diff < 60) history[i].timeStr = '刚刚'
      else if(diff < 3600) history[i].timeStr = Math.floor(diff / 60) + '分钟前'
      else if(diff < 86400) history[i].timeStr = Math.floor(diff / 3600) + '小时前'
      else history[i].timeStr = Math.floor(diff / 86400) + '天前'
    }
    return history
  },
  onViewHistoryItem(e){
    var idx = e.currentTarget.dataset.idx
    var history = this.data.aiHistory
    if(!history[idx]) return
    var results = history[idx].results
    this.setData({
      results: results,
      hasResult: true
    })
    wx.setStorageSync('_lastResults', { results: results, tabMode: this.data.tabMode })
  },
  onDeleteHistoryItem(e){
    var idx = e.currentTarget.dataset.idx
    var history = this.data.aiHistory
    history.splice(idx, 1)
    wx.setStorageSync('aiHistory', history)
    this.setData({ aiHistory: history })
  },
  onClearHistory(){
    wx.removeStorageSync('aiHistory')
    this.setData({ aiHistory: [] })
  }
})
