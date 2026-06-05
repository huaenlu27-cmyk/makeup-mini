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
            self.globalData.products = res.data
            wx.setStorageSync('cachedProducts', res.data)
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
      if(cached && cached.length){
        self.globalData.products = cached
        return
      }
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
