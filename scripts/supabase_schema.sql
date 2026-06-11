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

-- ===========================================================
-- 社群功能表
-- ===========================================================

-- 帖子表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  author_avatar TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  product_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  like_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开可读" ON posts FOR SELECT USING (true);
CREATE POLICY "可写" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "作者可更新" ON posts FOR UPDATE USING (author_id = current_user);
CREATE POLICY "作者可删" ON posts FOR DELETE USING (author_id = current_user);

-- 收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开可读" ON favorites FOR SELECT USING (true);
CREATE POLICY "可写" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "可删" ON favorites FOR DELETE USING (user_id = current_user);
