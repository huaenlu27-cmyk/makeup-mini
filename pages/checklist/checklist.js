let categories = { groups: [] }
let products = []
try{ categories = require('../../data/categories') }catch(e){ try{ categories = require('../../data/categories.json') }catch(e2){ categories = {} } }
try{ products = require('../../data/products') }catch(e){ try{ products = require('../../data/products.json') }catch(e2){ products = [] } }

Page({
  data: {
    categories: categories,
    selectedCat: '',
    viewMode: 'swatch',
    swatches: [],
    brands: [],
    brandCounts: {}
  },
  onLoad(){
    // default select first available category
    const firstGroup = (this.data.categories.groups && this.data.categories.groups[0]) || null
    const firstCat = firstGroup && firstGroup.items && firstGroup.items[0]
    if(firstCat) this.selectCategory(firstCat)
  },
  onSelectCategory(e){
    const cat = e.currentTarget.dataset.cat
    this.selectCategory(cat)
  },
  selectCategory(cat){
    this.setData({ selectedCat: cat, viewMode: 'swatch' })
    // derive swatches: find products whose category contains key words
    const matches = products.filter(p=> (p.category && cat && p.category.indexOf(cat.split('/')[0])>-1) || p.category===cat)
    // fallback: try keyword match
    const keyword = (cat||'').split('/')[0]
    const fallback = products.filter(p=> p.name && p.name.indexOf(keyword)>-1)
    const pool = matches.length>0? matches : fallback
    // build color groups
    const map = {}
    pool.forEach(s=>{
      const key = s.hex || s.colorName || '通用'
      if(!map[key]) map[key] = { name: s.colorName||'通用', hex: s.hex||'#f4f4f4', count: 0 }
      map[key].count += 1
    })
    const swatches = Object.values(map)
    // brands
    const brandCounts = {}
    pool.forEach(s=>{ brandCounts[s.brand] = (brandCounts[s.brand]||0)+1 })
    const brands = Object.keys(brandCounts).sort()
    this.setData({ swatches, brands, brandCounts })
  },
  setViewMode(e){
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
  },
  onViewBrand(e){
    const brand = e.currentTarget.dataset.brand
    // navigate to product page with focus brand filter
    wx.navigateTo({ url: '/pages/product/product?brand=' + encodeURIComponent(brand) })
  }
})
