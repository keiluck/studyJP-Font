---
name: mobile-reader-page
description: 移动端前台阅读页——逐句跟读页。逐句渲染（假名标注 + 高亮句背景标注）、底部固定播放器（变速/假名开关/翻译模式/集中听力）、播放高亮跟随。
---

# 前台阅读页：逐句跟读（含假名与背景标注）

来源：`src/pages/Mobile/ReaderPage/MobileReaderPage.tsx` + `src/components/Mobile/SentenceItem/MobileSentenceItem.tsx` + `src/components/Mobile/AudioPlayer/MobileAudioPlayer.tsx`

## 功能需求

1. 进入页面请求 `GET /api/articles/:id`，封面图 + 标题 + 日期（`ja-JP` locale）+ 逐句列表。
2. **逐句渲染**（SentenceItem）：日语原文 + 中文翻译，翻译三态（always / click / hidden）。
3. **假名标注（振り仮名）**：
   - 句子带 `rubyWords`（见 [[data-model-and-api]]）时逐词渲染：`w.ruby && showRuby` 用 `<ruby><span>{w.text}</span><rt>{w.ruby}</rt></ruby>`，否则 `<span>{w.text}</span>`；
   - `showRuby` 全局开关由页面持有，经播放器工具栏「あ カタカナ」按钮切换（关闭时按钮灰色 + 删除线）；
   - `rubyWords` 为空（未分词）整句降级渲染 `text`。
4. **背景标注（词类着色）**：仅当前播放句（isActive）内着色，逐词按类型：
   ```ts
   const typeColor = { han: '#ffb74d', katakana: '#4fc3f7', en: '#aed581', other: 'transparent' }
   const getWordType = (text: string) => {
     if (/\p{Script=Han}/u.test(text)) return 'han'        // 汉字：橙
     if (/[゠-ヿ]/.test(text)) return 'katakana'   // 片假名：蓝
     if (/[A-Za-z0-9]/.test(text)) return 'en'             // 英数：绿
     return 'other'
   }
   ```
   词块样式 `borderRadius: 4; padding: 1px 4px; display: inline-block`。
5. **播放高亮跟随**：`timeupdate` 按 `startTime`/`endTime` 找到当前时间所在句 → 高亮（浅蓝底 `#f0f7ff`）并 `scrollIntoView({ block: 'center' })`；点句跳到该句 `startTime` 播放。逐句数据以 `sentences` 为准（见 [[data-model-and-api]]），不做无时间轴估算降级。
6. **底部固定播放器**：进度条（拖动中不 seek、松手才 seek）、±10s/±30s、播放/暂停、工具栏四钮 —— スピード（七档变速 bottom-sheet）/ カタカナ（假名开关）/ リスニング（集中听力）/ 通訳（翻译模式 bottom-sheet）。
7. **集中听力模式**：全屏单句卡片（进度徽章 n/N）、2 秒回退、上/下一句跳转播放、文本隐藏盲听；卡片内同样渲染假名，但**不做背景标注**。

## 关键实现要点

- 所有工具栏状态（showRuby / speed / translationMode / listeningMode / showText）由页面持有，播放器是受控组件。
- `audio.play().catch(...)`：移动端自动播放策略可能拒绝，必须捕获。
- 显示假名时句子 `lineHeight` 加大（列表 2.2、听力卡片 2.4），给 `<rt>` 留空间。
- 两种模式共用同一个 `<audio>`（播放器保持挂载），切换模式音频不中断。

## 视觉规格

| 元素 | 值 |
|------|-----|
| 原文字号/行高 | 18px / 2.2（带假名）、1.8（无假名）；听力卡片 20–22px |
| 假名 `<rt>` | 10–11px，#888 |
| 翻译 | 13px，#888，opacity 过渡（click 模式切换不跳动） |
| 高亮句背景 | #f0f7ff |
| 词类着色 | 汉字 #ffb74d / 片假名 #4fc3f7 / 英数 #aed581 |
