var community = null
try{ community = require('../../utils/community') }catch(e){}

var FILTER_CATS = [
  { key: 'skin', name: '肤质', options: ['干皮','油皮','混油皮','干敏皮','中性皮','痘痘肌'] },
  { key: 'skinColor', name: '肤色', options: ['白皮','黄皮','黑皮'] },
  { key: 'style', name: '风格', options: ['韩妆','日杂妆','欧美妆','亚裔妆','泰妆','法式妆'] },
  { key: 'occ', name: '场景', options: ['通勤妆','约会妆','派对妆'] },
  { key: 'budget', name: '价位', options: ['平价','中等','高端'] }
]

Page({
  data: {
    posts: [],
    loading: true,
    filterShow: false,
    filterDragY: 0,
    filterCats: FILTER_CATS,
    selectedTags: [],
    selectedTagSet: {}
  },
  onLoad(){
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
    this._loadPosts()
  },
  onShow(){
    this._loadPosts()
    var app = getApp()
    var theme = (app && app.globalData && app.globalData.theme) || null
    if(theme) this.setData({ theme: theme })
  },
  _loadPosts(){
    if(!community) return
    this.setData({ loading: true })
    community.getPosts({ tags: this.data.selectedTags }, function(posts){
      var enriched = (posts || []).map(function(p){
        p._prodCount = (p.product_ids && p.product_ids.length) || 0
        p._timeStr = this._fmtTime(p.created_at)
        p.author_avatar = '👤'
        p.tags = Array.isArray(p.tags) ? p.tags : []
        return p
      }.bind(this))
      this.setData({ posts: enriched, loading: false })
    }.bind(this))
  },
  onToggleFilterPanel(){
    this.setData({ filterShow: !this.data.filterShow, filterDragY: 0 })
  },
  onFilterTouchStart(e){
    this._filterStartY = e.touches[0].clientY
  },
  onFilterTouchMove(e){
    var dy = e.touches[0].clientY - this._filterStartY
    if(dy < 0) dy = 0
    this.setData({ filterDragY: dy })
  },
  onFilterTouchEnd(e){
    if(this.data.filterDragY > 60){
      this.setData({ filterShow: false, filterDragY: 0 })
    } else {
      this.setData({ filterDragY: 0 })
    }
  },
  onToggleFilterTag(e){
    var tag = e.currentTarget.dataset.tag
    var tags = this.data.selectedTags.slice()
    var idx = tags.indexOf(tag)
    if(idx > -1){
      tags.splice(idx, 1)
    } else {
      tags.push(tag)
    }
    var set = {}
    for(var i = 0; i < tags.length; i++){ set[tags[i]] = true }
    this.setData({ selectedTags: tags, selectedTagSet: set })
  },
  onResetFilter(){
    this.setData({ selectedTags: [], selectedTagSet: {} })
  },
  onConfirmFilter(){
    this.setData({ filterShow: false })
    this._loadPosts()
  },
  onRemoveFilterTag(e){
    var tag = e.currentTarget.dataset.tag
    var tags = this.data.selectedTags.slice()
    var idx = tags.indexOf(tag)
    if(idx > -1) tags.splice(idx, 1)
    var set = {}
    for(var i = 0; i < tags.length; i++){ set[tags[i]] = true }
    this.setData({ selectedTags: tags, selectedTagSet: set })
    this._loadPosts()
  },
  goPost(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/post/post?id=' + id })
  },
  goCreate(){
    wx.navigateTo({ url: '/pages/create/create' })
  },
  _fmtTime(iso){
    if(!iso) return ''
    var d = new Date(iso)
    var now = Date.now()
    var diff = Math.floor((now - d.getTime()) / 1000)
    if(diff < 60) return '刚刚'
    if(diff < 3600) return Math.floor(diff / 60) + '分钟前'
    if(diff < 86400) return Math.floor(diff / 3600) + '小时前'
    if(diff < 172800) return '昨天'
    return (d.getMonth()+1) + '/' + d.getDate()
  }
})
