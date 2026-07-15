# copyskill — 日语跟读学习系统 前端功能提取文档

本目录从 proFont 项目的两组页面中提取出可复用的 **agents** 与 **skills**，
用于在另一个系统上复刻同类功能（语言跟读学习 App 的前台 + 后台）。

来源代码：
- 前台（移动端）：`src/pages/Mobile/`（HomePage、ReaderPage）及其依赖组件
- 后台（管理端）：`src/pages/Admin/AdminAritcle/`（AdminArticleList）

## 目录结构

```
copyskill/
├── README.md                        # 本文件（索引）
├── agents/
│   └── admin-article-agent.md       # 后台文章管理构建 Agent
└── skills/
    ├── data-model-and-api.md        # 数据模型 + API 契约（前后台共用，先读这个）
    ├── mobile-home-list.md          # 前台：文章列表首页
    ├── mobile-reader-page.md        # 前台：逐句跟读阅读页（假名标注 + 背景标注 + 播放器）
    └── admin-article-crud.md        # 后台：文章 CRUD + 音频上传
```

## 使用方式

1. 把本目录复制到目标项目的 `.claude/` 下（agents → `.claude/agents/`，skills → `.claude/skills/<name>/SKILL.md`），
   或直接作为需求/设计文档交给开发者。
2. 先读 `skills/data-model-and-api.md` 确定数据结构与接口约定，再按 agent 文档逐页实现。
3. 文档中的代码片段基于 React 18 + TypeScript + react-router-dom + axios，
   样式为内联 style（移动端）/ CSS class（后台），可按目标系统技术栈替换。

## 功能总览

| 模块 | 功能点 |
|------|--------|
| 前台首页 | 文章列表、加载/错误/空态、点击跳转阅读页 |
| 前台阅读页 | 逐句渲染、假名标注（振り仮名显隐）、高亮句词类背景标注、播放器（变速/翻译模式/集中听力） |
| 后台文章管理 | 列表、新建/编辑/删除、日中逐行对照录入、音频文件上传 |
| API 层 | axios 实例、Bearer token 拦截器、包裹式响应（HTTP 200 + body.code）统一转异常、401 跳登录 |
