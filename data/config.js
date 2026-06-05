var CAT_ORDER = [
  '妆前精华/喷雾', '隔离/妆前乳', '粉底液/气垫', '遮瑕', '粉饼/散粉',
  '定妆喷雾', '腮红', '修容/修颜', '高光', '眼影', '眼线', '睫毛膏',
  '眉笔/眉粉/染眉', '唇线笔', '口红/唇釉', '卸妆', '防晒', '化妆刷/工具'
]

var CAT_ICON = {
  '妆前精华/喷雾': '💦', '隔离/妆前乳': '🧴', '粉底液/气垫': '🔵',
  '遮瑕': '🎨', '粉饼/散粉': '⚪', '定妆喷雾': '🌫️',
  '腮红': '🌸', '修容/修颜': '✨', '高光': '💎',
  '眼影': '👁️', '眼线': '✏️', '睫毛膏': '🫦',
  '眉笔/眉粉/染眉': '✍️', '唇线笔': '🖊️', '口红/唇釉': '💄',
  '卸妆': '🧼', '防晒': '☀️', '化妆刷/工具': '🪥'
}

// Supabase 配置 — 替换成你自己的项目信息
var SUPABASE_URL = 'https://jphwqrxxplkujyfvkrzs.supabase.co'
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHdxcnh4cGxrdWp5ZnZrcnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjA3NzgsImV4cCI6MjA5NjE5Njc3OH0.Cae_EfC6vJoc2lAdoeIHzEDfQHmk4Hh0hv-0YZw-jaA

module.exports = { CAT_ORDER: CAT_ORDER, CAT_ICON: CAT_ICON, SUPABASE_URL: SUPABASE_URL, SUPABASE_KEY: SUPABASE_KEY }
