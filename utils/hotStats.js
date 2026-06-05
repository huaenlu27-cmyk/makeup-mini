function addHotStat(productId){
  var stats = wx.getStorageSync('hotStats') || {}
  if(!stats[productId]){
    stats[productId] = { count: 0, lastTime: 0 }
  }
  stats[productId].count++
  stats[productId].lastTime = Date.now()
  wx.setStorageSync('hotStats', stats)
}

function getHotProducts(prods, limit){
  limit = limit || 8
  var stats = wx.getStorageSync('hotStats') || {}
  var now = Date.now()
  var ids = Object.keys(stats)
  if(ids.length === 0) return []
  ids.sort(function(a, b){
    var sa = stats[a], sb = stats[b]
    var da = (now - sa.lastTime) / 86400000
    var db = (now - sb.lastTime) / 86400000
    var ra = da < 1 ? 3 : da < 3 ? 2 : da < 7 ? 1 : 0.5
    var rb = db < 1 ? 3 : db < 3 ? 2 : db < 7 ? 1 : 0.5
    var scoreA = sa.count * 0.7 + ra * 0.3
    var scoreB = sb.count * 0.7 + rb * 0.3
    return scoreB - scoreA
  })
  ids = ids.slice(0, limit)
  var result = []
  for(var i = 0; i < ids.length; i++){
    for(var j = 0; j < prods.length; j++){
      if(prods[j].id === ids[i]){ result.push(prods[j]); break }
    }
  }
  return result
}

module.exports = { addHotStat: addHotStat, getHotProducts: getHotProducts }
