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
      var theme = require('./theme')
      self.globalData.theme = theme || null
    }catch(e){ self.globalData.theme = null }

    // 尝试从 Supabase API 拉取商品
    ;(function(){
      var cfg
      try{ cfg = require('./data/config') }catch(e){}
      if(!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY){
        _loadLocal()
        return
      }
      wx.request({
        url: cfg.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/products?order=id.asc',
        header: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_KEY },
        success: function(res){
          if(res.data && res.data.length){
            var mapped = res.data.map(function(p){
              return { id:p.id, category:p.category, brand:p.brand, name:p.name, colorName:p.color_name, hex:p.hex||'', price:p.price, budget:p.budget }
            })
            self.globalData.products = mapped
            wx.setStorageSync('cachedProducts', mapped)
          } else {
            _loadLocal()
          }
        },
        fail: function(){ _loadLocal() },
        complete: function(){
          if(!self.globalData.products) _loadLocal()
        }
      })
    })()

    function _loadLocal(){
      var cached = wx.getStorageSync('cachedProducts')
      if(cached && cached.length && cached[0].colorName){
        self.globalData.products = cached
        return
      }
      wx.removeStorageSync('cachedProducts')
      try{
        self.globalData.products = require('./data/products')
      }catch(e){
        try{ self.globalData.products = require('./data/products.json') }catch(e2){
          self.globalData.products = []
        }
      }
    }
  }
})
