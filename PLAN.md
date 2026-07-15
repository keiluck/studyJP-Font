# 日语学习网站 — 前端开发 Plan（studyJP-Font）

> 本文档为前端总体开发计划，按四个阶段推进。每阶段完成并测试通过后再进入下一阶段。
> 后端接口约定见 `../studyJP-back/PLAN.md`。

## 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| 框架 | React 18 + Next.js 14（App Router） | 需求指定；文件式路由，无需 react-router |
| UI 库 | MUI 5（@mui/material + @mui/icons-material） | 需求指定；DataGrid 可用于后台表格 |
| HTTP | axios | 拦截器统一处理 token 和错误 |
| 状态管理 | Zustand | 轻量，只需管理登录态等少量全局状态 |
| 富文本编辑器 | wangEditor 5 | MUI 无富文本组件；wangEditor 轻量、中文文档好 |
| 语言 | TypeScript | 接口类型与后端 DTO 对齐，减少低级错误 |

说明：

- 前台用户端与后台管理端放在**同一个 Next.js 项目**中，通过路由前缀区分（`/` 用户端、`/admin` 管理端），token 与登录体系完全隔离（分别存 `user_token` / `admin_token`）。
- 本项目为登录后使用的学习/管理系统，不依赖 SEO，页面统一采用**客户端渲染**（`"use client"` + 客户端请求后端 API），不做 SSR 数据获取，避免 token 在服务端/客户端两头管理的复杂度。
- 开发环境通过 `next.config.js` 的 `rewrites` 把 `/api/**` 转发到 `http://localhost:8080`，避免跨域。

## 目录结构

```
studyJP-Font/
├── next.config.js           # rewrites: /api → http://localhost:8080
├── package.json
├── tsconfig.json
└── src/
    ├── app/                          # App Router 页面（文件式路由）
    │   ├── layout.tsx                # 根布局（MUI ThemeProvider、CssBaseline）
    │   ├── page.tsx                  # 首页 → 重定向到 /articles
    │   ├── (user)/                   # 前台用户端分组
    │   │   ├── layout.tsx            # 用户端布局（顶部 AppBar 导航）+ 用户守卫
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   └── articles/
    │   │       ├── page.tsx          # 课程列表
    │   │       └── [id]/page.tsx     # 课程详情（含语音播放）
    │   └── admin/                    # 后台管理端
    │       ├── layout.tsx            # 管理端布局（侧边 Drawer 菜单）+ 管理守卫
    │       ├── login/page.tsx
    │       ├── users/page.tsx        # 用户管理
    │       └── articles/
    │           ├── page.tsx          # 文章列表（状态筛选）
    │           └── edit/[[...id]]/page.tsx  # 新增/编辑（富文本 + 音频上传）
    ├── api/                 # 接口封装
    │   ├── request.ts       # axios 实例（用户端，携带 user_token）
    │   ├── adminRequest.ts  # axios 实例（管理端，携带 admin_token）
    │   ├── user.ts          # 登录/注册
    │   ├── article.ts       # 文章列表/详情
    │   └── admin/           # 后台接口（用户管理、文章管理、上传）
    ├── store/
    │   ├── userAuth.ts      # 用户端登录态
    │   └── adminAuth.ts     # 管理端登录态
    ├── components/
    │   ├── AuthGuard.tsx    # 客户端路由守卫（用户端/管理端复用，传入角色）
    │   └── AudioPlayer.tsx  # 语音播放器
    ├── theme/
    │   └── index.ts         # MUI 主题定制
    └── types/               # 与后端 DTO 对齐的类型定义
```

## 通用约定

- 所有列表页支持分页，参数统一 `page`（从 1 开始）+ `pageSize`。
- 后端统一响应格式 `{ code, message, data }`，axios 拦截器统一解包；`code === 401` 时清除 token 并跳转对应登录页。
- 登录守卫在各分组 `layout.tsx` 中通过客户端组件实现：无 token 时 `router.replace` 到对应登录页。

---

## 阶段一：基础框架搭建

**目标**：项目可启动，路由骨架跑通。

1. `npx create-next-app@latest`（TypeScript + App Router + src 目录），安装 @mui/material、@emotion/react、@emotion/styled、@mui/icons-material、axios、zustand。
2. 配置 MUI：根布局挂 `ThemeProvider` + `CssBaseline`，接入 Next.js 的 `@mui/material-nextjs` App Router 适配（缓存 emotion 样式）。
3. 配置 `next.config.js` rewrites：`/api/:path*` → `http://localhost:8080/api/:path*`。
4. 搭建路由骨架：用户端布局（AppBar）、管理端布局（Drawer）+ 空白占位页面。
5. 封装 axios 实例与统一响应处理。

**验收**：`npm run dev` 启动，可在用户端和 `/admin` 之间导航，MUI 样式正常无闪烁。

## 阶段二：用户端登录 + 权限体系

**目标**：注册、登录、路由守卫可用。

1. 注册页：用户名/邮箱/密码 + 确认密码，MUI TextField + react-hook-form 校验，调 `POST /api/user/register`。
2. 登录页：调 `POST /api/user/login`，成功后 token 存 localStorage（key: `user_token`），用户信息存 Zustand。
3. axios 请求拦截器自动带 `Authorization: Bearer <token>`。
4. `AuthGuard`：未登录访问受保护页面时重定向到 `/login`，并记录来源路径登录后跳回。
5. AppBar 展示登录状态、退出登录。

**验收**：注册 → 登录 → 刷新页面登录态保持 → 退出后受保护页面被拦截。

## 阶段三：文章列表 + 逐句跟读阅读页（含语音播放）

**目标**：学习者可以浏览课程，逐句跟读文章并听音频。

1. **列表页** `/articles`
   - `GET /api/user/articles?page=&pageSize=&level=&category=`
   - MUI Card + Grid 卡片式展示（封面图、标题、等级 Chip、分类）。
   - 顶部筛选：等级（N5–N1）、分类（Select）；MUI Pagination 分页，筛选条件同步到 URL query。
2. **阅读页** `/articles/[id]`
   - `GET /api/user/articles/{id}`，正文按句渲染（`SentenceItem`：日语原文 + 中文翻译三态），不再整体富文本渲染。
   - 逐句数据以 `sentences` 为准（含时间轴与假名标注，由后端对齐流水线生成），不做无时间轴估算降级。
   - **假名标注**：句子带 `rubyWords`（分词 + 振假名）时用 `<ruby>/<rt>` 渲染读音，播放器工具栏「あ カタカナ」按钮全局开关（`showRuby`）；无分词数据整句降级渲染。
   - **背景标注**：当前播放句内按词类型着色 —— 汉字 `#ffb74d`、片假名 `#4fc3f7`、英数 `#aed581`，非高亮句不着色。
   - `AudioPlayer` 底部固定播放器：进度条拖动（MUI Slider）±10s、播放/暂停、±30s、七档变速与翻译模式 bottom-sheet 弹窗、假名开关、集中听力入口。
   - 播放时按 `startTime`/`endTime` 高亮当前句并自动滚动。
   - 集中听力模式：全屏单句卡片（进度徽章 n/N）、2 秒回退、上/下一句跳转播放、文本隐藏盲听；卡片内同样渲染假名（不做背景标注）。
3. 后端阶段三接口未就绪时在 `src/api/` 层 mock（标 `// TODO: mock`），联调时移除。
   - **mock 与真实语音一致**：mock 文章的句子文本/翻译/时间轴必须与 `public/audio/` 下音频的实际语音内容对应（当前 `001.mp3` 为「自己紹介」四句，约 13s），不得使用与音频无关的占位文本；时间轴先按字数比例分配，再按听感微调。

**验收**：筛选+分页正确且刷新后保持；音频可播放/暂停、拖动进度、变速；播放高亮跟随并自动滚动；假名可全局显隐、高亮句词类背景着色正确；集中听力模式可逐句跳转与盲听。

## 阶段四：后台管理系统

**目标**：管理员登录后可管理用户与文章。

1. **管理端登录** `/admin/login`：调 `POST /api/admin/login`，token 存 `admin_token`，与用户端完全隔离；管理端 `layout.tsx` 守卫保护所有 `/admin/*` 页面。
2. **用户管理** `/admin/users`
   - MUI Table/DataGrid 分页列表（用户名、邮箱、状态、注册时间）。
   - 新增/编辑（Dialog 表单）、删除（软删除，确认 Dialog）、启用/禁用（Switch）。
3. **文章管理** `/admin/articles`
   - 列表：状态筛选（草稿/已发布）、等级/分类筛选、分页。
   - 新增/编辑页 `/admin/articles/edit/[id]`：
     - 标题、等级、分类、封面图上传、状态（存草稿/发布）。
     - wangEditor 富文本正文（`dynamic import` 关闭 SSR 加载）。
     - 音频上传：调 `POST /api/admin/upload/audio`，返回 URL 关联到文章，支持多条音频、可排序删除。
   - 删除：软删除，二次确认。

**验收**：后台增删改查全流程可用；用户端 token 无法访问后台页面和接口；草稿不出现在前台列表。

---

## 阶段依赖说明

- 阶段一不依赖后端；阶段二起需要后端对应阶段接口就绪。
- 后端接口未就绪时，可在 `api/` 层临时返回假数据，接口联调时移除。
