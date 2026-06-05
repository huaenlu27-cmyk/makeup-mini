-- products 表
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  color_name TEXT NOT NULL,
  hex TEXT,
  price NUMERIC NOT NULL,
  budget TEXT NOT NULL
);

-- 允许匿名读（小程序端不需要登录）
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开可读" ON products FOR SELECT USING (true);

-- 写入后确认
SELECT COUNT(*) AS 商品总数 FROM products;
