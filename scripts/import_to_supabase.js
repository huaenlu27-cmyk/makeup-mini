/**
 * 使用方式：
 *   node scripts/import_to_supabase.js <SUPABASE_URL> <SUPABASE_KEY>
 *
 * 示例：
 *   node scripts/import_to_supabase.js https://xxx.supabase.co eyJhbGciOi...
 */

var https = require('https')
var path = require('path')

var url = process.argv[2]
var key = process.argv[3]

if(!url || !key){
  console.log('用法: node scripts/import_to_supabase.js <SUPABASE_URL> <SUPABASE_KEY>')
  console.log('示例: node scripts/import_to_supabase.js https://xxx.supabase.co eyJhbGciOi...')
  process.exit(1)
}

// 读取 products.js
var products
try{
  products = require(path.join(__dirname, '..', 'data', 'products'))
}catch(e){
  try{
    products = require(path.join(__dirname, '..', 'data', 'products.json'))
  }catch(e2){
    console.error('找不到 data/products.js')
    process.exit(1)
  }
}

if(!products || !products.length){
  console.error('产品数据为空')
  process.exit(1)
}

// 转换字段名（camelCase → snake_case）
var rows = products.map(function(p){
  return {
    id: p.id,
    category: p.category,
    brand: p.brand,
    name: p.name,
    color_name: p.colorName,
    hex: p.hex || '',
    price: Number(p.price) || 0,
    budget: p.budget || 'mid'
  }
})

// 分批发送（Supabase 单次限制 1000 条）
var batchSize = 100
var total = rows.length
var sent = 0

function sendBatch(){
  var batch = rows.slice(sent, sent + batchSize)
  if(!batch.length){
    console.log('\n✓ 全部导入完成，共 ' + total + ' 条')
    return
  }

  var body = JSON.stringify(batch)
  var apiUrl = url.replace(/\/+$/, '') + '/rest/v1/products'

  var req = https.request(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Prefer': 'resolution=merge-duplicates'
    }
  }, function(res){
    var data = ''
    res.on('data', function(c){ data += c })
    res.on('end', function(){
      var ok = res.statusCode >= 200 && res.statusCode < 300
      if(ok){
        sent += batch.length
        process.stdout.write('\r  进度: ' + sent + '/' + total)
        sendBatch()
      } else {
        console.error('\n✗ 发送失败 (HTTP ' + res.statusCode + '):', data.slice(0, 200))
      }
    })
  })

  req.on('error', function(e){
    console.error('\n✗ 网络错误:', e.message)
  })

  req.write(body)
  req.end()
}

console.log('开始导入 ' + total + ' 条商品到 Supabase...')
sendBatch()
