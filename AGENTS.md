# 微信小程序开发规范

## WXML 模板
- `{{}}` 中只允许简单属性读取（`a.b`、`a[b]`、三元 `? :`）
- 禁止调用 Page 方法（如 `{{_isSelected(x)}}`）
- 禁止写复杂表达式（如 `||[]`、`.length`、`&&`）
- 所有需要计算的值在 JS 中预计算后存 `data`，模板只读

## 页面生命周期
- 每个页面必须有 `.wxml` `.wxss` `.js` `.json` 四个文件
- 缺少 `.json` 会导致 `define is not defined` 整页崩溃
- `scroll-view` 必须固定高度才能滚动，flex 布局中配合 `height: 0`

## JS 语法
- 使用 ES5 优先（`var`、`function`）
- 如需使用 ES6 语法（`let/const/=>`），需确保 `project.config.json` 中 `"es6": true` 已开启
- 模块用 CommonJS `require` / `module.exports`
- `setData` 支持 key path 更新：`this.setData({ 'obj.key': val })`

## 网络请求
- `wx.request` 的 4xx/5xx 状态码仍走 `success` 回调，需手动检查 `res.statusCode`
- 失败回调需兜底默认值

## 数据存储
- 购物车数据用 `wx.getStorageSync('cart')` 读写
- 用户首选项用 `wx.getStorageSync('skinProfile')` 等

## 底部 TabBar（当前项目）
- 顺序：0化妆清单 / 1智能推荐 / 2我的清单 / 3社群 / 4我的
- 购物车徽章 `index: 2`
- 所有加购操作必须同时调用 `setTabBarBadge`

## 主题
- CSS 变量优先（`var(--primary)`、`var(--bg)` 等）
- 页面背景等无法用变量的用内联 `style="background:{{theme.colors.xx}}"`

## Supabase 交互（当前项目）
- 通过 `utils/community.js` 封装，匿名 key REST API
- 请求回调检查 `statusCode` 和 `Array.isArray(res.data)`
- 不创建 RPC 函数，更新用 PATCH + `Prefer: return=representation`
- 帖子和收藏表都在 `scripts/supabase_schema.sql` 中定义

## 通用约定
- 不主动修改 `project.config.json`、`.gitignore`
- 不主动创建 `.md` 文档（除非用户要求）
- 不主动 commit / push
- 所有新功能先看现有代码的风格再写
