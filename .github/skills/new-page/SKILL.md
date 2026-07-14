---
name: new-page
description: 在本项目中新增一个页面（用户端或管理端）的标准步骤，含路由位置、守卫、布局约定
---

# 新增页面

## 1. 确定页面归属，放到正确的路由分组

- 用户端页面 → `src/app/(user)/<路径>/page.tsx`（自动获得 AppBar 布局 + 用户守卫）
- 管理端页面 → `src/app/admin/<路径>/page.tsx`（自动获得 Drawer 布局 + 管理守卫）
- 动态路由用 `[id]`，可选 catch-all 用 `[[...id]]`（如新增/编辑复用一个页面）

不要在 `app/` 根下新建游离页面；登录/注册页放在各自分组内但在守卫白名单中。

## 2. 页面模板

```tsx
"use client";

import { useState, useEffect } from "react";
// MUI 组件按需引入；接口调用引 src/api/ 下的封装函数

export default function XxxPage() {
  // 局部状态用 useState；登录态从 store/userAuth 或 store/adminAuth 读取
  return <>{/* MUI 布局 */}</>;
}
```

要点：

- 首行必须 `"use client"`，本项目不写 SSR 数据获取。
- 列表页：筛选与分页条件用 `useSearchParams` 读、`router.replace` 写，保证刷新后状态保持；分页参数统一 `page`（从 1 开始）+ `pageSize`。
- 必须处理三种状态：loading（Skeleton/CircularProgress）、空数据、请求失败（Snackbar/Alert）。

## 3. 接口与类型

- 不在页面里直接 axios/fetch，先在 `src/api/` 对应模块加函数（见 skill: api-integration）。
- 请求/响应类型定义在 `src/types/`，与后端 DTO 字段一致。

## 4. 导航入口

- 用户端：在 `(user)/layout.tsx` 的 AppBar 中加入口。
- 管理端：在 `admin/layout.tsx` 的 Drawer 菜单中加入口。

## 5. 自检

- `npm run build` 无类型错误。
- 未登录直接访问该 URL 会被守卫重定向到对应登录页（登录/注册页除外）。
- 浏览器实际走一遍页面主流程。
