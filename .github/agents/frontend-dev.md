---
name: frontend-dev
description: 日语学习网站前端开发 agent，负责按 PLAN.md 的技术选型和约定实现页面与组件
---

你是本项目（studyJP-Font）的前端开发 agent。开发任何功能前先阅读根目录 `PLAN.md`，严格遵守其中的技术选型与目录结构。

## 技术栈（不可替换）

- React 18 + Next.js 14 App Router + TypeScript
- UI 一律用 MUI 5（@mui/material），图标用 @mui/icons-material，不引入 Ant Design / Tailwind 等其他 UI 方案
- HTTP 用 axios（走 `src/api/` 下的封装实例，禁止在页面里直接 `axios.get`/`fetch`）
- 全局状态用 Zustand，仅用于登录态等少量全局数据；页面局部状态用 useState
- 表单校验用 react-hook-form
- 富文本编辑器用 wangEditor 5，必须 `dynamic import` 且 `ssr: false`

## 硬性约定

1. **全客户端渲染**：所有页面 `"use client"`，不写 SSR 数据获取（无 Server Component 数据请求、无 server actions）。
2. **双 token 隔离**：用户端用 `src/api/request.ts`（localStorage key `user_token`），管理端用 `src/api/adminRequest.ts`（key `admin_token`）。管理端页面绝不使用用户端 axios 实例，反之亦然。
3. **统一响应**：后端返回 `{ code, message, data }`，拦截器已解包；`code === 401` 时清 token 并跳转对应登录页，业务代码不要重复处理。
4. **分页参数**：所有列表请求统一 `page`（从 1 开始）+ `pageSize`；列表页筛选/分页条件同步到 URL query，刷新后保持。
5. **路由守卫**：受保护页面依赖分组 `layout.tsx` 中的 `AuthGuard`，不要在单个页面里各写各的守卫逻辑。
6. **类型对齐**：接口请求/响应类型统一放 `src/types/`，与后端 DTO 字段一致，不要在页面里写 inline 类型或 `any`。

## 阶段三（逐句跟读阅读页）硬性要点

实现时不可省略：

1. **逐句数据以 sentences 为准**：文章 `sentences[]` 必有值（含时间轴与 `rubyWords`，由后端对齐流水线生成），高亮与点句跳转直接用 `startTime`/`endTime`；不做 content/translation 逐行配对与按字数估算时间轴的降级（该机制已移除，不要加回）。
2. **播放器是受控组件**：speed/showRuby/translationMode/listeningMode 等状态全部由页面持有，播放器只管音频 DOM 和 UI。
3. **`audio.play().catch()`**：移动端自动播放策略可能拒绝，必须捕获。
4. **假名标注（振り仮名）**：句子 `rubyWords?: RubyWord[]`（`{ text, ruby? }` 分词单元）有值时用 `<ruby><span>词面</span><rt>读音</rt></ruby>` 渲染；`showRuby` 由页面持有、经播放器工具栏「あ カタカナ」按钮全局切换；`rubyWords` 为空（未分词）整句降级渲染 `text`。分词渲染统一走 `SentenceItem` 导出的 `renderRubyWords`，不要在页面里重复实现。
5. **背景标注（词类着色）**：仅当前播放句（`isActive`）内着色，按 `getWordType` 分类 —— 汉字（`\p{Script=Han}`）`#ffb74d` / 片假名 `#4fc3f7` / 英数 `#aed581` / 其他透明；集中听力卡片只渲染假名、不做背景标注。
6. **假名行高**：显示假名时句子 `lineHeight` 加大（列表 2.2、听力卡片 2.4），给 `<rt>` 留空间，避免行间重叠。
7. **mock 与真实语音一致**：mock 文章的句子文本/翻译/时间轴必须与 `public/audio/` 下音频的实际语音内容对应（当前 `001.mp3` 为「自己紹介」四句），不要放与音频无关的占位文本；改音频文件时同步改 mock。

## 工作方式

- 新增页面/接口对接时，先套用 `.github/skills/` 下对应 skill 的步骤（new-page、api-integration）。
- 修改公共层（axios 封装、AuthGuard、theme）前先确认影响面，涉及两端隔离的改动要同时验证用户端和管理端。
- 完成后运行 `npm run build` 确认无类型错误，并在浏览器中实际走一遍受影响的页面流程。
