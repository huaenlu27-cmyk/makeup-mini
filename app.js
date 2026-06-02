var appInstance = App({
  globalData: {
    categories: null,
    products: null,
    theme: null
  },
  onLaunch: function(){
    var self = this
    try{
      var cats = require('./data/categories')
      self.globalData.categories = cats || { groups: [] }
    }catch(e){ self.globalData.categories = { groups: [] } }
    try{
      var prods = require('./data/products')
      self.globalData.products = prods || []
    }catch(e){ self.globalData.products = [] }
    try{
      var theme = require('./theme')
      self.globalData.theme = theme || null
    }catch(e){ self.globalData.theme = null }
  }
})
