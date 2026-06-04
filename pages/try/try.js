let taxonomy = {}
let colorTable = {}
let products = []
try{
  taxonomy = require('../../data/taxonomy')
}catch(e){ try{ taxonomy = require('../../data/taxonomy.json') }catch(e2){ taxonomy = {} } }
try{
  colorTable = require('../../data/color_table')
}catch(e){ try{ colorTable = require('../../data/color_table.json') }catch(e2){ colorTable = {} } }
try{
  products = require('../../data/products')
}catch(e){ try{ products = require('../../data/products.json') }catch(e2){ products = [] } }

function _themeStyles(t){
  if(!t || !t.colors) return {}
  var c = t.colors
  return { bg:c.primaryBg, surface:c.surface, text:c.text, muted:c.muted, accent:c.accent, accentL:c.accentLight, border:c.border, chipBg:c.chipBg }
}

function _matchTone(hex, tone){
  if(!hex) return tone === '中'
  var r = parseInt(hex.slice(1,3), 16) / 255
  var g = parseInt(hex.slice(3,5), 16) / 255
  var b = parseInt(hex.slice(5,7), 16) / 255
  var lum = 0.299 * r + 0.587 * g + 0.114 * b
  if(tone === '浅') return lum >= 0.5
  if(tone === '深') return lum <= 0.5
  return true
}

Page({
  data: {
    undertones: taxonomy.undertones || [],
    tone: '中',
    undertone: taxonomy.undertones && taxonomy.undertones[1] ? taxonomy.undertones[1].key : 'neutral',
    recs: []
  },
  onLoad(){
    const app = getApp()
    let theme = (app && app.globalData && app.globalData.theme) ? app.globalData.theme : null
    if(!theme){ try{ theme = require('../../theme') }catch(e){ theme = null } }
    if(theme) this.setData({ theme, s: _themeStyles(theme) })
  },
  setTone(e){
    this.setData({ tone: e.currentTarget.dataset.tone })
  },
  setUndertone(e){
    this.setData({ undertone: e.currentTarget.dataset.key })
  },
  savePrefs(){
    wx.setStorageSync('prefs', { tone: this.data.tone, undertone: this.data.undertone })
    wx.showToast({ title: '已保存' })
  },
  runRecommend(){
    const uKey = this.data.undertone || 'neutral'
    const toneKey = this.data.tone || '中'
    const occ = 'day'
    const undertoneCN = uKey === 'warm' ? '暖' : (uKey === 'cool' ? '冷' : '中性')
    var groups = []

    // 1. Foundation — 受肤色深浅 + 色调双重影响
    try{
      const foundation = (colorTable.foundation || {})
      const depthEntry = foundation[toneKey] || {}
      const colors = depthEntry[undertoneCN] || []
      const enriched = colors.map(c=>{
        const hex = (c.hex||'').toLowerCase()
        const matches = products.filter(s=> (s.hex && s.hex.toLowerCase()===hex) || (s.colorName && s.colorName===c.name))
        return { color: c, skus: matches }
      })
      groups.push({ sourceName: toneKey + '肤·粉底', colors: enriched })
    }catch(e){}

    // 2. 唇部 — 受色调影响，同时按肤色深浅过滤 hex 亮度
    try{
      const lip = (colorTable.lip || {})
      const entry = lip[undertoneCN]
      let colors = []
      if(entry && entry[occ]){
        const budgets = entry[occ]
        Object.values(budgets).forEach(arr=>{ (arr||[]).forEach(c=> colors.push(c)) })
      }
      const enriched = colors.map(c=>{
        const hex = (c.hex||'').toLowerCase()
        var matches = products.filter(s=> (s.hex && s.hex.toLowerCase()===hex) || (s.colorName && s.colorName===c.name))
        matches = matches.filter(function(s){ return _matchTone(s.hex, toneKey) })
        return { color: c, skus: matches }
      })
      groups.push({ sourceName: '唇部推荐', colors: enriched })
    }catch(e){}

    this.setData({ recs: groups })
  },
  addSku(e){
    const bidx = e.currentTarget.dataset.bidx
    const idx = e.currentTarget.dataset.idx
    const block = this.data.recs[bidx]
    const col = block.colors[idx]
    if(!col || !col.skus || col.skus.length===0) return wx.showToast({ title: '暂无匹配 SKU', icon:'none' })
    const sku = col.skus[0]
    var cart = wx.getStorageSync('cart')||[]
    for(var c = 0; c < cart.length; c++){
      if(cart[c].id === sku.id){
        wx.showToast({ title: '已在清单中', icon: 'none' })
        return
      }
    }
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    this._updateBadge()
    wx.showToast({ title: '已加入清单' })
  },
  _updateBadge(){
    var cart = wx.getStorageSync('cart') || []
    wx.setTabBarBadge({ index: 2, text: cart.length > 99 ? '99+' : String(cart.length) })
  }
})
