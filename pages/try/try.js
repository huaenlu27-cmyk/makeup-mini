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
    if(theme) this.setData({ theme })
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
    // 简单策略：从 colorTable 中摘取与 undertone/日间对应的颜色，然后匹配 products
    const uKey = this.data.undertone || 'neutral'
    const occ = 'day'
    let colors = []
    try{
      const lip = (colorTable.lip || {})
      const entry = lip[ uKey === 'warm' ? '暖' : (uKey === 'cool' ? '冷' : '中性') ]
      if(entry && entry[occ]){
        const budgets = entry[occ]
        Object.values(budgets).forEach(arr=>{ (arr||[]).forEach(c=> colors.push(c)) })
      }
    }catch(e){}

    const enriched = colors.map(c=>{
      const hex = (c.hex||'').toLowerCase()
      const matches = products.filter(s=> (s.hex && s.hex.toLowerCase()===hex) || (s.colorName && s.colorName===c.name))
      return { color: c, skus: matches }
    })

    const result = [{ sourceName: '自动推荐', colors: enriched }]
    this.setData({ recs: result })
  },
  addSku(e){
    const bidx = e.currentTarget.dataset.bidx
    const idx = e.currentTarget.dataset.idx
    const block = this.data.recs[bidx]
    const col = block.colors[idx]
    if(!col || !col.skus || col.skus.length===0) return wx.showToast({ title: '暂无匹配 SKU', icon:'none' })
    const sku = col.skus[0]
    const cart = wx.getStorageSync('cart')||[]
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    wx.showToast({ title: '已加入清单' })
  }
})
