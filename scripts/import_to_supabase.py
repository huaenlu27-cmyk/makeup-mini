"""
使用方式: python3 scripts/import_to_supabase.py <SUPABASE_URL> <SUPABASE_KEY>
"""
import sys, json, urllib.request, os, re

url = sys.argv[1].rstrip('/')
key = sys.argv[2]

prods_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'products.js')
with open(prods_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 去掉 module.exports =
content = content.replace('module.exports =', '').strip()
if content.endswith(';'):
    content = content[:-1]

# 去掉单行注释 //
content = re.sub(r'//.*', '', content)
# 去掉对象/数组末尾多余的逗号（JSON 不允许）
content = re.sub(r',\s*}', '}', content)
content = re.sub(r',\s*\]', ']', content)

# 去掉前后空格
content = content.strip()

products = json.loads(content)

if not products:
    print('产品数据为空')
    sys.exit(1)

# 转换字段名
rows = []
for p in products:
    rows.append({
        'id': p['id'],
        'category': p['category'],
        'brand': p['brand'],
        'name': p['name'],
        'color_name': p['colorName'],
        'hex': p.get('hex', ''),
        'price': float(p['price']),
        'budget': p.get('budget', 'mid')
    })

api_url = url + '/rest/v1/products'
headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Prefer': 'resolution=merge-duplicates'
}

total = len(rows)
sent = 0
batch_size = 100

print(f'开始导入 {total} 条商品到 Supabase...')

while sent < total:
    batch = rows[sent:sent + batch_size]
    data = json.dumps(batch).encode('utf-8')
    req = urllib.request.Request(api_url, data=data, headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(req)
        sent += len(batch)
        print(f'\r  进度: {sent}/{total}', end='', flush=True)
    except urllib.error.HTTPError as e:
        print(f'\n✗ 发送失败 (HTTP {e.code}): {e.read().decode()[:200]}')
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f'\n✗ 网络错误: {e.reason}')
        sys.exit(1)

print(f'\n✓ 全部导入完成，共 {total} 条')
