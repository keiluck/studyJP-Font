---
name: api-integration
description: 对接后端接口的标准步骤，含双 axios 实例选择、类型定义、分页与错误处理约定
---

# 对接后端接口

## 1. 选对 axios 实例（关键）

| 接口前缀 | 实例 | token key |
|----------|------|-----------|
| `/api/user/**` | `src/api/request.ts` | `user_token` |
| `/api/admin/**` | `src/api/adminRequest.ts` | `admin_token` |

两端严禁混用。新接口文件放置：用户端功能直接放 `src/api/`（如 `article.ts`），管理端功能放 `src/api/admin/`。

## 2. 定义类型（src/types/）

与后端 DTO 字段完全一致。分页响应统一为：

```ts
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

## 3. 编写接口函数

```ts
// src/api/article.ts
import request from "./request";
import type { Article, PageResult } from "@/types";

export interface ArticleQuery {
  page: number;      // 从 1 开始
  pageSize: number;
  level?: string;
  category?: string;
}

export function fetchArticles(params: ArticleQuery) {
  return request.get<PageResult<Article>>("/api/user/articles", { params });
}
```

约定：

- 拦截器已把 `{ code, message, data }` 解包成 `data` 并在非 200 时抛错，业务函数直接返回数据类型。
- 401 由拦截器统一清 token + 跳登录页，**页面代码不要再判断 401**。
- 页面里的错误处理只做用户提示（Snackbar/Alert），错误消息优先用后端返回的 `message`。

## 4. 富文本字段约定

文章有两个富文本字段（后端入库前 jsoup 白名单过滤）：

- `content`：日语正文，**整段粘贴即可**，前端按 `。！？` 自动分句展示；
- `translation`：中文翻译（可空），同样整段粘贴，前端自动分句后与日语句**按顺序一一配对**（两边按 `。！？` 切出的句子数一致即可对上）。

管理端编辑页两个 wangEditor 分别录入；保存时空编辑器内容（`<p><br></p>`）要归一为空串再提交。

## 5. 文件上传（管理端）

- 音频：`POST /api/admin/upload/audio`（mp3/m4a/wav ≤50MB）
- 图片：`POST /api/admin/upload/image`（jpg/png/webp ≤5MB）
- 用 `FormData` + `adminRequest`，前端也做扩展名/大小预校验，失败给出明确提示；返回的 URL 直接可访问（后端静态映射 `/uploads/**`）。

## 6. 联调自检

- 打开 DevTools Network 确认：请求头带对了 token、分页参数为 `page`/`pageSize`。
- 用错误 token 或过期 token 验证会被重定向到对应登录页。
- 后端接口未就绪时可在 api 层临时返回假数据，但要加 `// TODO: mock` 标记，联调时移除。
