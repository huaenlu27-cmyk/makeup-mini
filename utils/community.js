function _getSupabase(){
  var cfg = null
  try{ cfg = require('../data/config') }catch(e){}
  if(!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) return null
  return { url: cfg.SUPABASE_URL.replace(/\/+$/, ''), key: cfg.SUPABASE_KEY }
}

function _headers(){
  var sb = _getSupabase()
  if(!sb) return null
  return { apikey: sb.key, Authorization: 'Bearer ' + sb.key, 'Content-Type': 'application/json', Prefer: 'return=representation' }
}

function getPosts(filters, callback){
  var h = _headers()
  if(!h){ callback([]); return }
  var sb = _getSupabase()
  var query = sb.url + '/rest/v1/posts?order=created_at.desc'
  if(filters && filters.tags && filters.tags.length > 0){
    var tagStr = '{'
    for(var i = 0; i < filters.tags.length; i++){
      if(i > 0) tagStr += ','
      tagStr += '"' + filters.tags[i] + '"'
    }
    tagStr += '}'
    query += '&tags=cs.' + encodeURIComponent(tagStr)
  }
  if(filters && filters.limit) query += '&limit=' + filters.limit
  wx.request({
    url: query,
    header: h,
    success: function(res){
      if(res.statusCode >= 200 && res.statusCode < 300 && Array.isArray(res.data)){
        callback(res.data)
      } else {
        callback([])
      }
    },
    fail: function(){ callback([]) }
  })
}

function getPost(postId, callback){
  var h = _headers()
  if(!h){ callback(null); return }
  var sb = _getSupabase()
  wx.request({
    url: sb.url + '/rest/v1/posts?id=eq.' + postId,
    header: h,
    success: function(res){
      if(res.statusCode >= 200 && res.statusCode < 300 && Array.isArray(res.data) && res.data.length > 0){
        callback(res.data[0])
      } else {
        callback(null)
      }
    },
    fail: function(){ callback(null) }
  })
}

function createPost(post, callback){
  var h = _headers()
  if(!h){ callback(null); return }
  var sb = _getSupabase()
  wx.request({
    url: sb.url + '/rest/v1/posts',
    method: 'POST',
    header: h,
    data: post,
    success: function(res){
      callback((res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data[0]) || null)
    },
    fail: function(){ callback(null) }
  })
}

function toggleFavorite(userId, postId, isAdding, callback){
  var h = _headers()
  if(!h){ callback(false); return }
  var sb = _getSupabase()
  if(isAdding){
    wx.request({
      url: sb.url + '/rest/v1/favorites',
      method: 'POST',
      header: h,
      data: { user_id: userId, post_id: postId },
      success: function(){
        wx.request({
          url: sb.url + '/rest/v1/posts?id=eq.' + postId + '&select=favorite_count',
          header: h,
          success: function(res){
            var cur = (res.data && res.data[0] && res.data[0].favorite_count) || 0
            wx.request({
              url: sb.url + '/rest/v1/posts?id=eq.' + postId,
              method: 'PATCH',
              header: Object.assign({}, h, { 'Content-Type': 'application/json' }),
              data: { favorite_count: cur + 1 },
              complete: function(){ callback(true) }
            })
          },
          fail: function(){ callback(false) }
        })
      },
      fail: function(){ callback(false) }
    })
  } else {
    wx.request({
      url: sb.url + '/rest/v1/favorites?user_id=eq.' + userId + '&post_id=eq.' + encodeURIComponent(postId),
      method: 'DELETE',
      header: h,
      success: function(){
        wx.request({
          url: sb.url + '/rest/v1/posts?id=eq.' + postId + '&select=favorite_count',
          header: h,
          success: function(res){
            var cur = (res.data && res.data[0] && res.data[0].favorite_count) || 0
            wx.request({
              url: sb.url + '/rest/v1/posts?id=eq.' + postId,
              method: 'PATCH',
              header: Object.assign({}, h, { 'Content-Type': 'application/json' }),
              data: { favorite_count: Math.max(cur - 1, 0) },
              complete: function(){ callback(true) }
            })
          },
          fail: function(){ callback(false) }
        })
      },
      fail: function(){ callback(false) }
    })
  }
}

function checkFavorited(userId, postId, callback){
  var h = _headers()
  if(!h){ callback(false); return }
  var sb = _getSupabase()
  wx.request({
    url: sb.url + '/rest/v1/favorites?user_id=eq.' + userId + '&post_id=eq.' + postId + '&select=id',
    header: h,
    success: function(res){
      callback(res.data && res.data.length > 0)
    },
    fail: function(){ callback(false) }
  })
}

function getUserFavorites(userId, callback){
  var h = _headers()
  if(!h){ callback([]); return }
  var sb = _getSupabase()
  wx.request({
    url: sb.url + '/rest/v1/favorites?user_id=eq.' + userId + '&select=post_id',
    header: h,
    success: function(res){
      if(res.statusCode >= 200 && res.statusCode < 300 && Array.isArray(res.data)){
        var ids = res.data.map(function(f){ return f.post_id })
        if(ids.length === 0){ callback([]); return }
        var idFilter = 'in.(' + ids.join(',') + ')'
        wx.request({
          url: sb.url + '/rest/v1/posts?id=' + idFilter + '&order=created_at.desc',
          header: h,
          success: function(r){
            if(r.statusCode >= 200 && r.statusCode < 300 && Array.isArray(r.data)){
              callback(r.data)
            } else { callback([]) }
          },
          fail: function(){ callback([]) }
        })
      } else { callback([]) }
    },
    fail: function(){ callback([]) }
  })
}

function getUserId(){
  var uid = wx.getStorageSync('communityUserId')
  if(!uid){
    uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
    wx.setStorageSync('communityUserId', uid)
  }
  return uid
}

module.exports = {
  getPosts: getPosts,
  getPost: getPost,
  createPost: createPost,
  toggleFavorite: toggleFavorite,
  checkFavorited: checkFavorited,
  getUserFavorites: getUserFavorites,
  getUserId: getUserId
}
