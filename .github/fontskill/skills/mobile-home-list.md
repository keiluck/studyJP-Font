---
name: mobile-home-list
description: 移动端前台首页——文章列表页。加载文章列表，展示标题+首行摘要，点击进入阅读页；含 loading 转圈、错误重试、空态三种状态。
---

# 前台首页：文章列表

来源：`src/pages/Mobile/HomePage/MobileHomePage.tsx`（约 96 行，单文件组件）

## 功能需求

1. 进入页面自动请求 `GET /api/articles`，展示文章列表。
2. 三态渲染：
   - **加载中**：全屏居中转圈 spinner + 「加载中...」
   - **错误**：全屏居中 ❌ 错误消息 + 「重新加载」按钮（`window.location.reload()`）
   - **空列表**：居中灰字「暂无文章」
3. 顶部吸顶 header：应用标题（如「日语跟读学习」）+ 副标题「N 篇文章」。
4. 列表项（每篇文章一行）：
   - 左：44×44 圆角图标块（🎧 emoji 占位，可换封面图）
   - 中：标题（16px 粗体，单行省略）+ 内容首行摘要（13px 灰色，单行省略）
   - 右：`›` 箭头
   - 点击整行 → `navigate('/m/japanese/all/article/${id}')` 进入阅读页
5. 移动端优先：白底、细分割线（#f5f5f5）、无 hover 依赖。

## 关键实现要点

- 数据加载遵循 [[data-model-and-api]] 的 loading/error 状态机。
- 吸顶 header：`position: sticky; top: 0; zIndex: 10; borderBottom: 1px solid #f0f0f0`。
- 单行省略三件套：`overflow: hidden; textOverflow: ellipsis; whiteSpace: nowrap`，
  且中间列容器要 `flex: 1; minWidth: 0`（否则 flex 子项不收缩、省略号失效）。
- spinner 用纯 CSS：
  ```tsx
  <div style={{ width: 36, height: 36, border: '3px solid #eee',
    borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  ```

## 视觉规格

| 元素 | 值 |
|------|-----|
| 主色（标题文字） | #1a1a2e |
| 次要文字 | #999 / #aaa |
| 分割线 | #f0f0f0（header）/ #f5f5f5（列表项） |
| 标题字号 | header 22px / 列表项 16px |
| 列表项内边距 | 16px |
