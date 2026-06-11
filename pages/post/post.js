var community = null
try{ community = require('../../utils/community') }catch(e){}

Page({
  data: {
    post: null,
    products: [],
    isFavorited: false,
    userId: ''
  },
  onLoad(options){
    var id = options.id
    this.setData({ postId: id, userId: community ? community.getUserId() : '' })
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._loadPost(id)
  },
  _loadPost(id){
    if(!community) return
    community.getPost(id, function(post){
      if(!post) return
      post._prodCount = (post.product_ids && post.product_ids.length) || 0
      post._timeStr = this._fmtTime(post.created_at)
      post.author_avatar = '👤'
      this.setData({ post: post })
      this._loadProducts(post.product_ids || [])
      if(this.data.userId){
        community.checkFavorited(this.data.userId, post.id, function(fav){
          this.setData({ isFavorited: fav })
        }.bind(this))
      }
    }.bind(this))
  },
  _loadProducts(ids){
    var app = getApp()
    var prods = (app && app.globalData && app.globalData.products) || []
    if(prods.length === 0){
      try{ prods = require('../../data/products') }catch(e){}
    }
    var items = []
    for(var i = 0; i < ids.length; i++){
      for(var j = 0; j < prods.length; j++){
        if(prods[j].id === ids[i]){ items.push(prods[j]); break }
      }
    }
    this.setData({ products: items })
  },
  onToggleFav(){
    if(!community || !this.data.post) return
    var post = this.data.post
    var isFav = this.data.isFavorited
    community.toggleFavorite(this.data.userId, post.id, !isFav, function(ok){
      if(ok){
        var newCount = isFav ? (post.favorite_count || 1) - 1 : (post.favorite_count || 0) + 1
        if(newCount < 0) newCount = 0
        post.favorite_count = newCount
        this.setData({ isFavorited: !isFav, post: post })
        wx.showToast({ title: isFav ? '已取消收藏' : '已收藏', icon: 'success' })
      }
    }.bind(this))
  },
  onAddToCart(e){
    var id = e.currentTarget.dataset.id
    var items = this.data.products
    var sku = null
    for(var i = 0; i < items.length; i++){
      if(items[i].id === id){ sku = items[i]; break }
    }
    if(!sku) return
    var cart = wx.getStorageSync('cart') || []
    for(var c = 0; c < cart.length; c++){
      if(cart[c].id === id){ wx.showToast({ title: '已在清单中', icon: 'none' }); return }
    }
    cart.push(sku)
    wx.setStorageSync('cart', cart)
    try{ var hotStats = require('../../utils/hotStats'); if(hotStats) hotStats.addHotStat(id) }catch(e){}
    wx.setTabBarBadge({ index: 2, text: cart.length > 99 ? '99+' : String(cart.length) })
    wx.showToast({ title: '已加入清单', icon: 'success' })
  },
  goBack(){ wx.navigateBack() },
  onShareAppMessage(){
    return { title: this.data.post ? this.data.post.title : '美妆搭配分享', path: '/pages/post/post?id=' + this.data.postId }
  },
  _fmtTime(iso){
    if(!iso) return ''
    var d = new Date(iso)
    return (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0')
  }
})
